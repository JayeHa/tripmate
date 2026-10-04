-- 장소 입력 폼(일정 직접 추가). 시안 폼의 칸 중 DB 에 없던 것을 더하고, 장소 + 일정을 한 번에 만드는 함수를 둔다.
--
-- places.wait          : 예상 대기(「40분」 처럼 자유 글). 장소 정보라 모든 일정 · 가이드에 같이 보인다
-- places.category rest : 휴식(온천 · 스파 · 마사지). 홈 가이드 탭과 장소 폼의 카테고리
-- schedule_items.links : 일정 링크 [{ title, url }] — 이번 방문에만 해당하는 예약 페이지 · 구매한 상품. 장소 링크(places.links)와 따로다

alter table public.places
  add column wait text check (char_length(wait) <= 30),
  drop constraint places_category_check,
  add constraint places_category_check
    check (category in ('sight', 'food', 'cafe', 'shop', 'rest', 'stay', 'air'));

alter table public.schedule_items
  add column links jsonb not null default '[]' check (jsonb_typeof(links) = 'array');

-- 장소를 둘 도시: 그 여행의 도시 중 좌표가 가장 가까운 곳(좌표가 없으면 첫 도시),
-- 여행에 도시가 없으면 전체 도시 중 가장 가까운 곳. 둘 다 없으면 null(부르는 쪽이 거부한다).
-- 0015 add_schedule_place 의 규칙을 그대로 뽑았다. invoker 라 여행 도시는 멤버만 읽힌다.
create function public.place_city_for_trip(p_trip uuid, p_lat double precision, p_lng double precision)
returns text
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_city text;
begin
  select tc.city_id into v_city
  from public.trip_cities tc
  join public.cities c on c.id = tc.city_id
  where tc.trip_id = p_trip
  order by
    case when p_lat is null or p_lng is null then 0
         else (c.lat - p_lat) ^ 2 + ((c.lng - p_lng) * cos(radians(p_lat))) ^ 2 end,
    tc.position
  limit 1;
  if v_city is null and p_lat is not null and p_lng is not null then
    select c.id into v_city
    from public.cities c
    order by (c.lat - p_lat) ^ 2 + ((c.lng - p_lng) * cos(radians(p_lat))) ^ 2
    limit 1;
  end if;
  return v_city;
end $$;
revoke all on function public.place_city_for_trip(uuid, double precision, double precision) from public;
grant execute on function public.place_city_for_trip(uuid, double precision, double precision) to authenticated;

-- add_schedule_place(0015)도 같은 도시 규칙을 쓰게 한다. 동작은 0015 와 같다(두 곳이 따로 놀지 않게).
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
    v_city := public.place_city_for_trip(p_trip, v_lat, v_lng);
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

-- 장소 폼(일정 모드)의 「일정에 담기」. 장소 정보 칸으로 새 장소를 만들고, 일정 칸으로 그날 끝에 일정을 붙인다.
--   p_place: { name, emoji?, category?, lat?, lng?, address?, google_place_id?, hours?, rating?, review_count?, wait?, description?, gmap_url?, links? }
--   p_item : { status?, start_time?, memo?, links? }
-- 직접 입력이라 같은 구글 장소 재사용은 하지 않는다(구글 장소를 고르면 일정 추가 화면의 검색 경로로 담는다).
-- 이름은 공백을 떼고 100자로 자르고, 비면 거부한다. 칸 값은 테이블 check 제약이 지킨다.
-- security invoker 라 RLS 가 그대로 걸린다: 멤버가 아니면 일정을 못 넣고, 그러면 장소도 남지 않는다.
create function public.create_place_schedule(p_trip uuid, p_day int, p_place jsonb, p_item jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_city text;
  v_place uuid;
  v_item uuid;
begin
  if v_name = '' then
    raise exception 'place name is required';
  end if;
  v_city := public.place_city_for_trip(p_trip, v_lat, v_lng);
  if v_city is null then
    raise exception 'trip has no city and the place has no location';
  end if;

  insert into public.places (
    city_id, name, emoji, category, lat, lng, address, google_place_id,
    hours, rating, review_count, wait, description, gmap_url, links
  ) values (
    v_city, v_name,
    nullif(p_place ->> 'emoji', ''),
    nullif(p_place ->> 'category', ''),
    v_lat, v_lng,
    nullif(p_place ->> 'address', ''),
    nullif(p_place ->> 'google_place_id', ''),
    nullif(p_place ->> 'hours', ''),
    (p_place ->> 'rating')::numeric,
    (p_place ->> 'review_count')::int,
    nullif(p_place ->> 'wait', ''),
    nullif(p_place ->> 'description', ''),
    nullif(p_place ->> 'gmap_url', ''),
    coalesce(p_place -> 'links', '[]'::jsonb)
  )
  returning id into v_place;

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
revoke all on function public.create_place_schedule(uuid, int, jsonb, jsonb) from public;
grant execute on function public.create_place_schedule(uuid, int, jsonb, jsonb) to authenticated;
