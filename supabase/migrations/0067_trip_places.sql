-- 여행 가이드 보관함(#17 ⑤-a) — 여행마다 일행과 함께 쓰는 장소 목록.
-- 일정에 넣은 장소는 자동으로 들어가고, 일정에서 지워도 보관함에는 남는다. 장소 자체(places)는 지금처럼 만든 사람의 것이다.
-- 쓰기(담기 · 빼기 · 메모)는 ⑤-b 에서 정책과 함께 연다. 지금은 읽기와 일정 트리거만
create table public.trip_places (
  trip_id    uuid not null references public.trips(id) on delete cascade,
  -- 보관함에 있는 장소는 지우지 못한다(일정이 쓰는 장소와 같다)
  place_id   uuid not null references public.places(id) on delete restrict,
  added_by   uuid references public.profiles(id) on delete set null default auth.uid(),
  -- 이 여행에서 이 장소에 대한 메모 — 장소 설명과 달리 여행마다 다르다
  memo       text check (memo is null or char_length(btrim(memo)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trip_id, place_id)
);
create index trip_places_place_idx on public.trip_places(place_id);

create trigger trip_places_updated_at before update on public.trip_places
  for each row execute function public.set_updated_at();

alter table public.trip_places enable row level security;
create policy "trip_places_select" on public.trip_places
  for select to authenticated using (public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.trip_places;
alter table public.trip_places replica identity full;

-- ---------- 일정에 넣은 장소 → 보관함 ----------
-- 일정 줄(대체 장소 포함)이 장소를 쓰게 되면 그 여행 보관함에도 넣는다. 이미 있으면 그대로(담은 사람 · 메모 유지)
create function public.add_trip_place_from_item()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.place_id is not null then
    insert into public.trip_places (trip_id, place_id, added_by)
    values (new.trip_id, new.place_id, new.created_by)
    on conflict do nothing;
  end if;
  return null;
end $$;

create trigger schedule_items_trip_places after insert or update of place_id on public.schedule_items
  for each row execute function public.add_trip_place_from_item();

-- 지금까지 일정에 넣은 장소를 채운다 — 처음 넣은 사람 · 시각으로
insert into public.trip_places (trip_id, place_id, added_by, created_at)
select trip_id, place_id, (array_agg(created_by order by created_at))[1], min(created_at)
from public.schedule_items
where place_id is not null
group by trip_id, place_id
on conflict do nothing;

-- ---------- 장소 읽기 · 붙이기 ----------
-- 같은 여행 보관함의 장소는 멤버가 읽고, 일정에 붙일 수 있다(일행이 담은 장소를 「+ 일정」)
drop policy "places_select" on public.places;
create policy "places_select" on public.places
  for select to authenticated using (
    created_by = auth.uid()
    or exists (
      select 1 from public.schedule_items si
      where si.place_id = places.id and public.is_trip_member(si.trip_id)
    )
    or exists (
      select 1 from public.stays s
      where s.place_id = places.id and public.is_trip_member(s.trip_id)
    )
    or exists (
      select 1 from public.trip_places tp
      where tp.place_id = places.id and public.is_trip_member(tp.trip_id)
    )
  );

create or replace function public.can_attach_place(p_place uuid, p_trip uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.places p where p.id = p_place and p.created_by = auth.uid())
      or exists (select 1 from public.schedule_items si where si.place_id = p_place and si.trip_id = p_trip)
      or exists (select 1 from public.stays s where s.place_id = p_place and s.trip_id = p_trip)
      or exists (select 1 from public.trip_places tp where tp.place_id = p_place and tp.trip_id = p_trip);
$$;

-- ---------- 나가기: 보관함도 소유자 사본으로 ----------
-- 일정 · 숙소와 같이, 나간 사람이 만든 장소 중 이 여행 보관함에 있는 것도 소유자 사본으로 바꾼다.
-- 보관함 줄을 일정보다 먼저 옮긴다 — 일정을 먼저 바꾸면 트리거가 사본 줄을 따로 넣어 원본 줄(메모)과 둘이 된다.
-- 소유자 보관함에 같은 사본이 이미 있으면 원본 줄을 지운다
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
        category, emoji, rating, review_count, wait, description, hours, hours_week, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_ko, r.address_detail,
        r.category, r.emoji, r.rating, r.review_count, r.wait, r.description, r.hours, r.hours_week, r.gmap_url, r.links
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
