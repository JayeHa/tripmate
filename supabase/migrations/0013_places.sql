-- 장소(Place) · 일정(ScheduleItem) 분리.
-- 「다음 여행에서도 맞는 정보 = 장소」는 도시 단위로 places 에 두고 내 여러 여행이 함께 쓴다.
-- 「이번 방문에만 맞는 정보 = 일정」(날짜 · 순서 · 시각 · 예약 상태 · 메모 · 대체 장소)은 schedule_items 에 남는다.
-- 0010 에서 일정 한 줄이 직접 갖던 장소 칸을 places 로 옮기고, 일정은 place_id 로 참조한다.
--
-- 수정 권한: 장소를 만든 사람만(created_by). 일행은 일정에서 읽기만 한다.
--   나중에 관리자 수정 · 승인으로 넓히려면 places_update_owner · places_delete_owner 두 정책만 고친다.
-- 읽기: 만든 사람 + 그 장소를 일정에 쓰는 여행의 멤버.
-- note · flight 일정은 장소가 없다. 제목(name) · 설명(description)을 일정이 직접 갖는다.
-- emoji 는 장소의 기본 아이콘이고, 일정의 emoji 는 그 일정에서만 바꾼 아이콘(override)이다.

create table public.places (
  id              uuid primary key default gen_random_uuid(),
  city_id         text not null references public.cities(id),
  -- 계정을 지우는 흐름(#29)이 생기면 이 장소를 쓰는 남의 일정을 어떻게 할지 함께 정한다
  created_by      uuid not null default auth.uid() references public.profiles(id),
  name            text not null check (char_length(name) between 1 and 100),
  google_place_id text,
  lat             double precision,
  lng             double precision,
  address         text,
  category        text check (category in ('sight', 'food', 'cafe', 'shop', 'stay', 'air')),
  emoji           text,
  -- 사용자가 직접 적는다. Google 평점은 약관상 저장할 수 없다(#34)
  rating          numeric(2, 1) check (rating between 0 and 5),
  review_count    int check (review_count >= 0),
  description     text,
  hours           text,
  gmap_url        text,
  -- [{ title, url }] 구글맵 외 장소 링크
  links           jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- 같은 사람이 같은 구글 장소를 두 번 담으면 장소는 하나, 일정이 둘이다
create unique index places_owner_google_key on public.places(created_by, google_place_id)
  where google_place_id is not null;
create index places_owner_city_idx on public.places(created_by, city_id);

create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();

-- ---------- 기존 일정의 장소 칸 → places ----------
-- 원격 데이터는 개발용이지만 옮기는 쪽이 간단해서 옮긴다.
-- 도시는 그 여행의 첫 도시, 여행에 도시가 없으면(0006 이전 여행) 좌표가 가장 가까운 도시. 둘 다 없으면 지운다.
alter table public.schedule_items rename column place_id to google_place_id;
alter table public.schedule_items add column place_id uuid;

delete from public.schedule_items si
where si.kind = 'place'
  and si.lat is null
  and not exists (select 1 from public.trip_cities tc where tc.trip_id = si.trip_id);

-- 장소 하나 = (만든 사람, 구글 장소) 하나. 구글 장소가 없으면 일정마다 따로
with grouped as (
  select coalesce(si.created_by, t.owner_id) as owner,
         coalesce(si.google_place_id, si.id::text) as place_key,
         gen_random_uuid() as new_id
  from public.schedule_items si
  join public.trips t on t.id = si.trip_id
  where si.kind = 'place'
  group by 1, 2
)
update public.schedule_items si
set place_id = g.new_id
from grouped g, public.trips t
where t.id = si.trip_id
  and si.kind = 'place'
  and g.owner = coalesce(si.created_by, t.owner_id)
  and g.place_key = coalesce(si.google_place_id, si.id::text);

-- 같은 장소를 쓰는 일정이 여럿이면 가장 앞선 일정의 값을 쓴다
insert into public.places (
  id, city_id, created_by, name, google_place_id, lat, lng, address, category, emoji,
  rating, review_count, description, hours, gmap_url, links
)
select distinct on (si.place_id)
  si.place_id,
  coalesce(
    (select tc.city_id from public.trip_cities tc where tc.trip_id = si.trip_id order by tc.position limit 1),
    (select c.id from public.cities c order by (c.lat - si.lat) ^ 2 + (c.lng - si.lng) ^ 2 limit 1)
  ),
  coalesce(si.created_by, t.owner_id),
  si.name, si.google_place_id, si.lat, si.lng, si.address, si.category, si.emoji,
  si.rating, si.review_count, si.description, si.hours, si.gmap_url, si.links
from public.schedule_items si
join public.trips t on t.id = si.trip_id
where si.place_id is not null
order by si.place_id, si.day_index, si.position;

-- 장소 칸은 places 로 갔다. 장소 일정의 제목 · 설명 · 아이콘도 장소 쪽 값을 쓴다
alter table public.schedule_items alter column name drop not null;
update public.schedule_items
set name = null, description = null, emoji = null
where kind = 'place';

alter table public.schedule_items
  drop column google_place_id,
  drop column lat,
  drop column lng,
  drop column address,
  drop column category,
  drop column rating,
  drop column review_count,
  drop column hours,
  drop column gmap_url,
  drop column links,
  -- 일정이 쓰는 장소는 지울 수 없다. 장소를 지우려면 그 일정부터 지운다
  add constraint schedule_items_place_fkey foreign key (place_id)
    references public.places(id) on delete restrict,
  add constraint schedule_items_place_kind_chk check (
    (kind = 'place') = (place_id is not null)
    and (kind = 'place' or name is not null)
  );
create index schedule_items_place_idx on public.schedule_items(place_id);

-- ---------- RLS ----------
alter table public.places enable row level security;

create policy "places_select" on public.places
  for select to authenticated using (
    created_by = auth.uid()
    or exists (
      select 1 from public.schedule_items si
      where si.place_id = places.id and public.is_trip_member(si.trip_id)
    )
  );
create policy "places_insert_owner" on public.places
  for insert to authenticated with check (created_by = auth.uid());
create policy "places_update_owner" on public.places
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "places_delete_owner" on public.places
  for delete to authenticated using (created_by = auth.uid());

-- 일정에 붙일 수 있는 장소: 내가 만든 장소, 또는 이 여행의 다른 일정이 이미 쓰는 장소(일행이 같은 곳을 한 번 더 담을 때).
-- 남의 보관함 장소 id 를 알아도 내 여행에 끌어와 읽을 수 없게 한다.
-- security definer 다: places 정책이 schedule_items 를 읽으므로, 여기서 places 를 RLS 로 다시 읽으면 정책이 서로를 부른다.
create function public.can_attach_place(p_place uuid, p_trip uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.places p where p.id = p_place and p.created_by = auth.uid())
      or exists (select 1 from public.schedule_items si where si.place_id = p_place and si.trip_id = p_trip);
$$;
revoke all on function public.can_attach_place(uuid, uuid) from public;
grant execute on function public.can_attach_place(uuid, uuid) to authenticated;

drop policy "items_all" on public.schedule_items;
create policy "items_all" on public.schedule_items
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (
    public.is_trip_member(trip_id)
    and (place_id is null or public.can_attach_place(place_id, trip_id))
  );

-- ---------- 장소를 일정에 담기 ----------
-- 장소 검색에서 고른 곳을 그날 끝에 붙인다. 장소와 일정을 한 트랜잭션으로 만든다.
-- 같은 구글 장소를 이미 내 보관함에 담았으면 그 장소를 다시 쓴다(장소 1 · 일정 2).
-- 장소의 도시는 그 여행의 도시 중 좌표가 가장 가까운 곳(좌표가 없으면 첫 도시).
-- security invoker 라 RLS 가 그대로 걸린다: 멤버가 아니면 일정을 못 넣고, 그러면 장소도 남지 않는다.
create function public.add_schedule_place(p_trip uuid, p_day int, p_place jsonb)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_google text := nullif(p_place ->> 'google_place_id', '');
  v_lat double precision := (p_place ->> 'lat')::double precision;
  v_lng double precision := (p_place ->> 'lng')::double precision;
  v_place uuid;
  v_city text;
  v_item uuid;
begin
  if v_google is not null then
    select id into v_place from public.places
    where created_by = auth.uid() and google_place_id = v_google;
  end if;

  if v_place is null then
    select tc.city_id into v_city
    from public.trip_cities tc
    join public.cities c on c.id = tc.city_id
    where tc.trip_id = p_trip
    order by
      case when v_lat is null or v_lng is null then 0
           else (c.lat - v_lat) ^ 2 + ((c.lng - v_lng) * cos(radians(v_lat))) ^ 2 end,
      tc.position
    limit 1;
    if v_city is null then
      raise exception 'trip not found or has no city';
    end if;

    insert into public.places (city_id, name, google_place_id, lat, lng, address)
    values (v_city, p_place ->> 'name', v_google, v_lat, v_lng, nullif(p_place ->> 'address', ''))
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

-- 일행이 장소를 고치면 같은 여행의 다른 화면에도 반영되게. 행마다 RLS 로 볼 수 있는 사람에게만 간다
alter publication supabase_realtime add table public.places;
alter table public.places replica identity full;
