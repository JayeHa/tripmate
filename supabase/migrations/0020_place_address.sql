-- 장소 입력 2단계(위치 먼저) — 주소 칸.
--
-- places.address        : (있던 칸) 한국어로 요청한 주소. 일본은 구글에 한국어 표기가 없어 로마자로 온다(docs/policies/place-search.md)
-- places.address_local  : 현지어 주소(일본이면 「東京都渋谷区神南１丁目７−３」). 현지인 · 택시에 보여 주는 용도
-- places.address_detail : 사용자가 적는 상세 위치(「파르코 본관 8F」)
--
-- create_place_schedule · copy_places_on_leave 는 칸을 하나씩 나열하므로 새 칸을 더해 다시 정의한다(0018 · 0019 와 같고 두 칸만 더했다).
-- places 에 칸을 더할 때 copy_places_on_leave 를 빠뜨리지 않게 db.test 가 places 칸과 함수 본문을 대조한다.

alter table public.places
  add column address_local text check (char_length(address_local) <= 200),
  add column address_detail text check (char_length(address_detail) <= 100);

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
      address_detail = coalesce(nullif(p_place ->> 'address_detail', ''), address_detail),
      hours = coalesce(nullif(p_place ->> 'hours', ''), hours),
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
      city_id, name, emoji, category, lat, lng, address, address_local, address_detail, google_place_id,
      hours, rating, review_count, wait, description, gmap_url, links
    ) values (
      v_city, v_name,
      nullif(p_place ->> 'emoji', ''),
      nullif(p_place ->> 'category', ''),
      v_lat, v_lng,
      nullif(p_place ->> 'address', ''),
      nullif(p_place ->> 'address_local', ''),
      nullif(p_place ->> 'address_detail', ''),
      v_google,
      nullif(p_place ->> 'hours', ''),
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
        city_id, created_by, name, google_place_id, lat, lng, address, address_local, address_detail,
        category, emoji, rating, review_count, wait, description, hours, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_detail,
        r.category, r.emoji, r.rating, r.review_count, r.wait, r.description, r.hours, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;
