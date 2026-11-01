-- 비용에 장소(선택, #289) — 일정에 없는 곳(편의점 · 약국)에서 쓴 돈도 어디서 썼는지 남긴다. 일정 · 보관함은 건드리지 않는다.
-- 장소는 비용 입력에서 구글 검색으로 고르면 내 장소로 만든다(upsert_my_place). 일정을 연결한 비용은 그 일정의 장소를 쓰므로 비워 둔다.
alter table public.expenses
  add column place_id uuid references public.places(id) on delete set null;
create index expenses_place_id_idx on public.expenses (place_id) where place_id is not null;

comment on column public.expenses.place_id is '비용을 쓴 곳(선택). 일정을 연결한 비용은 비운다';

-- ---------- 읽기: 비용에 붙은 장소도 그 여행 멤버가 읽는다 ----------
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
    or exists (
      select 1 from public.expenses e
      where e.place_id = places.id and public.is_trip_member(e.trip_id)
    )
  );

-- ---------- 붙이기: 내 장소이거나 이 여행이 이미 쓰는 장소(비용 포함) ----------
-- 비용도 넣는다 — 일행이 붙인 장소가 있는 비용을 내가 고칠 때(금액만 바꿔도 행 전체를 다시 검사한다) 막히지 않게
create or replace function public.can_attach_place(p_place uuid, p_trip uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.places p where p.id = p_place and p.created_by = auth.uid())
      or exists (select 1 from public.schedule_items si where si.place_id = p_place and si.trip_id = p_trip)
      or exists (select 1 from public.stays s where s.place_id = p_place and s.trip_id = p_trip)
      or exists (select 1 from public.trip_places tp where tp.place_id = p_place and tp.trip_id = p_trip)
      or exists (select 1 from public.expenses e where e.place_id = p_place and e.trip_id = p_trip);
$$;

drop policy "expenses_all" on public.expenses;
create policy "expenses_all" on public.expenses
  for all to authenticated
  using (public.is_trip_member(trip_id))
  with check (
    public.is_trip_member(trip_id)
    and (place_id is null or public.can_attach_place(place_id, trip_id))
  );

-- ---------- 나가기: 비용에 붙은 장소도 소유자 사본으로 ----------
-- 일정 · 숙소 · 보관함과 같다(0071 과 같고 비용 두 줄만 더한다)
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
        or exists (select 1 from public.expenses e where e.place_id = p.id and e.trip_id = old.trip_id)
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
        category, subtype, emoji, area_id, rating, review_count, wait, description, hours, hours_week, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.address_local, r.address_ko, r.address_detail,
        r.category, r.subtype, r.emoji, r.area_id, r.rating, r.review_count, r.wait, r.description, r.hours, r.hours_week, r.gmap_url, r.links
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
    update public.expenses set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;
