-- 장소를 일정에 담을 때 여행에 도시가 없으면 좌표가 가장 가까운 도시로 둔다.
-- 0013 은 여행 도시에서만 골라, 도시가 없는 여행(0006 이전 · 도시를 다 지운 여행)에는 장소를 담지 못했다.
-- 좌표도 도시도 없으면(이름만 적은 장소) 여전히 거부한다.
-- 이름은 앞뒤 공백을 떼고 100자로 자른다(places.name 제약). 비면 거부한다.
create or replace function public.add_schedule_place(p_trip uuid, p_day int, p_place jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_place uuid;
  v_city text;
  v_item uuid;
begin
  if v_google is not null then
    select id into v_place from public.places
    where created_by = auth.uid() and google_place_id = v_google;
  end if;

  if v_place is null then
    if v_name = '' then
      raise exception 'place name is required';
    end if;
    select tc.city_id into v_city
    from public.trip_cities tc
    join public.cities c on c.id = tc.city_id
    where tc.trip_id = p_trip
    order by
      case when v_lat is null or v_lng is null then 0
           else (c.lat - v_lat) ^ 2 + ((c.lng - v_lng) * cos(radians(v_lat))) ^ 2 end,
      tc.position
    limit 1;
    -- 여행에 도시가 없으면(0006 이전 여행 · 도시를 다 지운 여행) 좌표가 가장 가까운 도시
    if v_city is null and v_lat is not null and v_lng is not null then
      select c.id into v_city
      from public.cities c
      order by (c.lat - v_lat) ^ 2 + ((c.lng - v_lng) * cos(radians(v_lat))) ^ 2
      limit 1;
    end if;
    if v_city is null then
      raise exception 'trip has no city and the place has no location';
    end if;

    insert into public.places (city_id, name, google_place_id, lat, lng, address)
    values (v_city, v_name, v_google, v_lat, v_lng, nullif(p_place ->> 'address', ''))
    returning id into v_place;
  end if;

  insert into public.schedule_items (trip_id, day_index, position, kind, place_id, created_by)
  values (
    p_trip, p_day,
    (select coalesce(max(position) + 1, 0) from public.schedule_items
      where trip_id = p_trip and day_index = p_day),
    'place', v_place, auth.uid()
  )
  returning id into v_item;
  return v_item;
end $$;
revoke all on function public.add_schedule_place(uuid, int, jsonb) from public;
grant execute on function public.add_schedule_place(uuid, int, jsonb) to authenticated;
