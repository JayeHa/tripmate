-- 운영시간 요일별(장소 입력 「매일 같음 | 요일별」).
--
-- places.hours      : (있던 칸) 매일 같은 운영시간 「10:00–20:00」
-- places.hours_week : 요일별 운영시간 { "mon": "10:00–20:00", ..., "sun": null } — 값이 null 이면 그 요일 휴무,
--                     키가 없으면 모름. 화면은 요일 값이 하나라도 있으면 hours_week, 아니면 hours 를 본다.
--                     「매일 같음」으로 다시 담으면 폼이 {} 를 보내 예전 요일별 값을 지운다
--
-- create_place_schedule · copy_places_on_leave 를 칸 하나 더해 다시 정의한다(0021 과 같고 hours_week 만 추가).
-- 다시 담을 때 hours_week 를 보내지 않거나 JSON null 이면 기존 값을 둔다(-> 는 JSON null 을 jsonb 'null' 로 돌려줘 nullif 로 SQL NULL 로 바꾼다).

alter table public.places
  add column hours_week jsonb check (hours_week is null or jsonb_typeof(hours_week) = 'object');

create or replace function public.create_place_schedule(p_trip uuid, p_day int, p_place jsonb, p_item jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_links jsonb := coalesce(p_place -> 'links', '[]'::jsonb);
  v_city text;
  v_place uuid;
  v_item uuid;
begin
  if v_name = '' then
    raise exception 'place name is required';
  end if;

  if v_google is not null then
    select id into v_place from public.places
    where created_by = auth.uid() and google_place_id = v_google;
  end if;

  if v_place is not null then
    update public.places set
      name = v_name,
      category = coalesce(nullif(p_place ->> 'category', ''), category),
      emoji = coalesce(nullif(p_place ->> 'emoji', ''), emoji),
      lat = coalesce(v_lat, lat),
      lng = coalesce(v_lng, lng),
      address = coalesce(nullif(p_place ->> 'address', ''), address),
      address_local = coalesce(nullif(p_place ->> 'address_local', ''), address_local),
      address_ko = coalesce(nullif(p_place ->> 'address_ko', ''), address_ko),
      address_detail = coalesce(nullif(p_place ->> 'address_detail', ''), address_detail),
      hours = coalesce(nullif(p_place ->> 'hours', ''), hours),
      hours_week = coalesce(nullif(p_place -> 'hours_week', 'null'::jsonb), hours_week),
      rating = coalesce((p_place ->> 'rating')::numeric, rating),
      review_count = coalesce((p_place ->> 'review_count')::int, review_count),
      wait = coalesce(nullif(p_place ->> 'wait', ''), wait),
      description = coalesce(nullif(p_place ->> 'description', ''), description),
      gmap_url = coalesce(nullif(p_place ->> 'gmap_url', ''), gmap_url),
      links = case when jsonb_array_length(v_links) > 0 then v_links else links end
    where id = v_place;
  else
    v_city := public.place_city_for_trip(p_trip, v_lat, v_lng);
    if v_city is null then
      raise exception 'trip has no city and the place has no location';
    end if;

    insert into public.places (
      city_id, name, emoji, category, lat, lng, address, address_local, address_ko, address_detail, google_place_id,
      hours, hours_week, rating, review_count, wait, description, gmap_url, links
    ) values (
      v_city, v_name,
      nullif(p_place ->> 'emoji', ''),
      nullif(p_place ->> 'category', ''),
      v_lat, v_lng,
      nullif(p_place ->> 'address', ''),
      nullif(p_place ->> 'address_local', ''),
      nullif(p_place ->> 'address_ko', ''),
      nullif(p_place ->> 'address_detail', ''),
      v_google,
      nullif(p_place ->> 'hours', ''),
      nullif(p_place -> 'hours_week', 'null'::jsonb),
      (p_place ->> 'rating')::numeric,
      (p_place ->> 'review_count')::int,
      nullif(p_place ->> 'wait', ''),
      nullif(p_place ->> 'description', ''),
      nullif(p_place ->> 'gmap_url', ''),
      v_links
    )
    returning id into v_place;
  end if;

  insert into public.schedule_items (
    trip_id, day_index, position, kind, place_id, status, start_time, memo, links, created_by
  ) values (
    p_trip, p_day,
    (select coalesce(max(position) + 1, 0) from public.schedule_items
      where trip_id = p_trip and day_index = p_day),
    'place', v_place,
    nullif(p_item ->> 'status', ''),
    (nullif(p_item ->> 'start_time', ''))::time,
    nullif(p_item ->> 'memo', ''),
    coalesce(p_item -> 'links', '[]'::jsonb),
    auth.uid()
  )
  returning id into v_item;
  return v_item;
end $$;

create or replace function public.copy_places_on_leave()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  r record;
  v_copy uuid;
begin
  select owner_id into v_owner from public.trips where id = old.trip_id;
  if v_owner is null or v_owner = old.user_id then
    return old;
  end if;

  for r in
    select distinct p.*
    from public.places p
    join public.schedule_items si on si.place_id = p.id
    where si.trip_id = old.trip_id and p.created_by = old.user_id
  loop
    v_copy := null;
    if r.google_place_id is not null then
      select id into v_copy from public.places
      where created_by = v_owner and google_place_id = r.google_place_id;
    end if;
    if v_copy is null then
      insert into public.places (
        city_id, created_by, name, google_place_id, lat, lng, address, address_local, address_ko, address_detail,
        category, emoji, rating, review_count, wait, description, hours, hours_week, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_ko, r.address_detail,
        r.category, r.emoji, r.rating, r.review_count, r.wait, r.description, r.hours, r.hours_week, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;
