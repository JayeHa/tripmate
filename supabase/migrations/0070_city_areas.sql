-- 도시별 지역 목록과 장소의 지역(#17 ⑤-c-2) — 홈 가이드 「전 지역 ⌄」 필터.
--
-- 지역은 도시마다 정해 둔 목록(이름 · 중심 좌표 · 반경)이다. 장소는 그중 하나를 가리키거나(area_id) 비어 있다(「기타」).
-- 처음 값은 좌표로 정한다 — 반경 안에 든 지역 중 중심이 가장 가까운 곳, 없으면 비움. 장소 입력에서 고칠 수 있다.
-- 목록이 없는 도시는 필터를 숨긴다. 지금은 도쿄만 있다(시안의 지역 아홉 곳).
--
-- 정하는 곳은 트리거 하나(places_set_area) — 장소를 넣는 경로(일정 추가 · 직접 추가 · 가이드 · 숙소 · 나간 멤버 사본)가 여럿이라
-- 함수마다 넣지 않는다. 넣을 때 비어 있으면 정하고, 위치(좌표 · 도시)가 바뀌었는데 지역은 그대로면 다시 정한다.
-- 나간 멤버의 사본(copy_places_on_leave)은 지역도 옮긴다. 숙소 copy-on-write 사본은 지역 칸을 옮기지 않아 좌표로 다시 정해진다
-- (숙소는 가이드 탭에 보이지 않는다).

create table public.city_areas (
  id       text primary key,                 -- 영문 slug(tokyo-ginza)
  city_id  text not null references public.cities(id) on delete cascade,
  name     text not null,
  position smallint not null,                -- 필터 · 장소 입력에서 보이는 순서
  lat      double precision not null,
  lng      double precision not null,
  radius_m int not null check (radius_m > 0), -- 이 안에 든 장소만 처음 값으로 이 지역이 된다
  unique (city_id, position)
);

alter table public.city_areas enable row level security;
create policy "city_areas_read" on public.city_areas for select to authenticated using (true);

insert into public.city_areas (id, city_id, name, position, lat, lng, radius_m) values
  ('tokyo-ginza',      'tokyo', '긴자',                1, 35.6717, 139.7650, 1100),
  ('tokyo-nihonbashi', 'tokyo', '니혼바시 · 도쿄역',   2, 35.6830, 139.7715, 1300),
  ('tokyo-ikebukuro',  'tokyo', '이케부쿠로',          3, 35.7295, 139.7109, 1500),
  ('tokyo-harajuku',   'tokyo', '하라주쿠 · 오모테산도', 4, 35.6687, 139.7068, 1000),
  ('tokyo-shibuya',    'tokyo', '시부야',              5, 35.6590, 139.7010, 1000),
  ('tokyo-shinjuku',   'tokyo', '신주쿠',              6, 35.6915, 139.7020, 1500),
  ('tokyo-asakusa',    'tokyo', '아사쿠사 · 스카이트리', 7, 35.7125, 139.8030, 1800),
  ('tokyo-kawagoe',    'tokyo', '카와고에',            8, 35.9180, 139.4850, 3000),
  ('tokyo-narita',     'tokyo', '나리타 공항',         9, 35.7720, 140.3880, 5000);

alter table public.places add column area_id text references public.city_areas(id) on delete set null;

-- 그 도시에서 좌표가 반경 안에 든 지역 중 중심이 가장 가까운 곳. 좌표가 없거나 든 곳이 없으면 null.
-- 거리는 위도에 맞춘 평면 근사(지역 반경이 몇 km 라 충분하다)
create function public.nearest_city_area(p_city text, p_lat double precision, p_lng double precision)
returns text
language sql stable security invoker set search_path = '' as $$
  select a.id
  from public.city_areas a
  cross join lateral (
    select 111320 * sqrt(power(p_lat - a.lat, 2) + power((p_lng - a.lng) * cos(radians((p_lat + a.lat) / 2)), 2)) as m
  ) d
  where a.city_id = p_city and p_lat is not null and p_lng is not null and d.m <= a.radius_m
  order by d.m
  limit 1
$$;

revoke all on function public.nearest_city_area(text, double precision, double precision) from public;
grant execute on function public.nearest_city_area(text, double precision, double precision) to authenticated;

create function public.set_place_area()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.area_id is null then
      new.area_id := public.nearest_city_area(new.city_id, new.lat, new.lng);
    end if;
  elsif (new.lat, new.lng, new.city_id) is distinct from (old.lat, old.lng, old.city_id)
        and new.area_id is not distinct from old.area_id then
    new.area_id := public.nearest_city_area(new.city_id, new.lat, new.lng);
  end if;
  -- 다른 도시의 지역은 붙지 않는다(여러 도시 여행에서 장소 입력이 첫 도시의 지역을 보낸 경우) — 좌표로 다시 정한다
  if new.area_id is not null
     and not exists (select 1 from public.city_areas where id = new.area_id and city_id = new.city_id) then
    new.area_id := public.nearest_city_area(new.city_id, new.lat, new.lng);
  end if;
  return new;
end $$;

create trigger places_set_area before insert or update on public.places
  for each row execute function public.set_place_area();

-- 장소 저장(일정 직접 추가 · 가이드)이 지역도 받는다 — 0069 와 같고 area_id 만 더한다.
-- 이미 가진 장소를 고쳐 쓸 때 지역을 보내지 않으면 그대로(위치가 바뀌면 트리거가 다시 정한다)
create or replace function public.upsert_my_place(p_trip uuid, p_place jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_name text := left(btrim(coalesce(p_place ->> 'name', '')), 100);
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_links jsonb := coalesce(p_place -> 'links', '[]'::jsonb);
  v_emoji text := left(nullif(btrim(p_place ->> 'emoji'), ''), 8);
  v_area text := nullif(p_place ->> 'area_id', '');
  v_city text;
  v_place uuid;
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
      emoji = coalesce(emoji, v_emoji),
      area_id = coalesce(v_area, area_id),
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
    return v_place;
  end if;

  v_city := public.place_city_for_trip(p_trip, v_lat, v_lng);
  if v_city is null then
    raise exception 'trip has no city and the place has no location';
  end if;

  insert into public.places (
    city_id, name, category, emoji, area_id, lat, lng, address, address_local, address_ko, address_detail, google_place_id,
    hours, hours_week, rating, review_count, wait, description, gmap_url, links
  ) values (
    v_city, v_name,
    nullif(p_place ->> 'category', ''),
    v_emoji,
    v_area,
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
  return v_place;
end $$;

-- 나간 멤버의 장소 → 소유자 사본: 0067 과 같고 지역(area_id)만 더한다
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
    where p.created_by = old.user_id
      and (
        exists (select 1 from public.schedule_items si where si.place_id = p.id and si.trip_id = old.trip_id)
        or exists (select 1 from public.stays s where s.place_id = p.id and s.trip_id = old.trip_id)
        or exists (select 1 from public.trip_places tp where tp.place_id = p.id and tp.trip_id = old.trip_id)
      )
  loop
    v_copy := null;
    if r.google_place_id is not null then
      select id into v_copy from public.places
      where created_by = v_owner and google_place_id = r.google_place_id;
    end if;
    if v_copy is null then
      insert into public.places (
        city_id, created_by, name, google_place_id, lat, lng, address, address_local, address_ko, address_detail,
        category, emoji, area_id, rating, review_count, wait, description, hours, hours_week, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_ko, r.address_detail,
        r.category, r.emoji, r.area_id, r.rating, r.review_count, r.wait, r.description, r.hours, r.hours_week, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    if exists (select 1 from public.trip_places where trip_id = old.trip_id and place_id = v_copy) then
      delete from public.trip_places where trip_id = old.trip_id and place_id = r.id;
    else
      update public.trip_places set place_id = v_copy where trip_id = old.trip_id and place_id = r.id;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
    update public.stays set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;

-- 지금 있는 장소를 채운다. 고친 시각(updated_at)은 그대로 둔다 — 사용자가 고친 것이 아니다
alter table public.places disable trigger places_updated_at;
update public.places set area_id = public.nearest_city_area(city_id, lat, lng)
where area_id is null and lat is not null;
alter table public.places enable trigger places_updated_at;
