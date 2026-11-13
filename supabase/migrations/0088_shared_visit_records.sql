-- 함께 쓰는 기록 (#313 4차 ③, 2026-11-12 핸드오프).
--
-- 0085 · 0086 은 일정 × 사람마다 따로였다. 이제 글 · 사진은 방문(일정 항목)마다 하나이고 일행이 함께 쓴다(별점만 각자, 0087).
--   * 글: 일정에 하나(item_id 가 키). 멤버 누구나 쓰고 · 고치고 · 지운다. 마지막으로 고친 사람(updated_by)을 남긴다 — 남의 이름으로는 쓰지 못한다(RLS)
--   * 동시에 고치면 나중 저장이 이긴다(사용자 결정 2026-11-12). 저장은 save_visit_note(일정 id, 글, 저장한 시각, 본 버전) —
--     그사이 일행이 고친 글을 덮었으면 true 를 돌려주고 화면이 알린다
--   * 고친 사람의 계정이 지워져도 함께 쓴 글은 남는다(updated_by → null)
--   * 사진: 일정에 10장까지(사람마다 10장이 아니다). 올린 사람(user_id)은 그대로 남고 바뀌지 않는다.
--     설명 · 순서 고치기와 지우기는 멤버 누구나(사용자 결정 2026-11-12)
--   * 저장소 정책(0086)은 그대로 — 붙은 줄이 없는 파일만 지운다. 화면은 줄을 지운 뒤 파일을 지운다
--
-- 옛 줄: 글은 일정마다 가장 나중에 고친 한 줄만 남긴다. 사진은 모두 남긴다 — 10장을 넘는 일정은 더 넣지 못할 뿐이다.
--
-- 권한: 여행 멤버. 익명(둘러보기)도 자기 여행이면 된다(남의 여행에는 멤버로 들어가지 못한다).

-- ---------- 기록 글 ----------
delete from public.visit_notes n
using public.visit_notes s
where n.item_id = s.item_id
  and (n.updated_at, n.user_id) < (s.updated_at, s.user_id);

drop policy "visit_notes_insert" on public.visit_notes;
drop policy "visit_notes_update" on public.visit_notes;
drop policy "visit_notes_delete" on public.visit_notes;

alter table public.visit_notes drop constraint visit_notes_pkey;
alter table public.visit_notes drop constraint visit_notes_user_id_fkey;
alter table public.visit_notes rename column user_id to updated_by;
alter table public.visit_notes alter column updated_by drop not null;
alter table public.visit_notes
  add constraint visit_notes_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.visit_notes add primary key (item_id);

create policy "visit_notes_insert" on public.visit_notes
  for insert to authenticated
  with check (updated_by = auth.uid() and public.is_trip_member(trip_id));

-- 일행이 쓴 글도 고친다. 고친 사람은 나로만 — 고친 사람을 그대로 둔 채 글만 바꾸지 못한다
create policy "visit_notes_update" on public.visit_notes
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (updated_by = auth.uid() and public.is_trip_member(trip_id));

create policy "visit_notes_delete" on public.visit_notes
  for delete to authenticated
  using (public.is_trip_member(trip_id));

-- 일정 하나의 기록 글을 저장한다. 글이 비면 지운다 — 두 번 올라가도 결과가 같다(오프라인 대기열).
-- p_seen = 고치기 시작할 때 본 글의 updated_at(글이 없었으면 null). 지금 글이 그것과 다르고 일행이 고친 것이면
-- 그 글을 덮은 것이라 true 를 돌려준다(내가 고친 글은 다시 올린 것이거나 내 다른 기기라 알리지 않는다).
-- 호출자 권한(RLS)으로 돈다. 일정이 이미 지워졌으면 지우기는 그냥 끝내고, 쓰기는 거부한다
create function public.save_visit_note(p_item uuid, p_body text, p_at timestamptz, p_seen timestamptz)
returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  v_trip      uuid;
  v_old       record;
  v_overwrote boolean;
begin
  select si.trip_id into v_trip from public.schedule_items si where si.id = p_item;

  if v_trip is null then
    if p_body = '' then
      return false;
    end if;
    raise exception 'save_visit_note: 일정이 없다' using errcode = 'check_violation';
  end if;

  select n.updated_at, n.updated_by into v_old
  from public.visit_notes n where n.item_id = p_item
  for update;
  v_overwrote := found
    and v_old.updated_by is distinct from auth.uid()
    and v_old.updated_at is distinct from p_seen;

  if p_body = '' then
    delete from public.visit_notes where item_id = p_item;
    return v_overwrote;
  end if;

  insert into public.visit_notes (item_id, trip_id, body, updated_at)
  values (p_item, v_trip, p_body, p_at)
  on conflict (item_id)
  do update set body = excluded.body, updated_at = excluded.updated_at, updated_by = auth.uid();
  return v_overwrote;
end $$;

-- ---------- 기록 사진 ----------
drop policy "visit_photos_update" on public.visit_photos;
drop policy "visit_photos_delete" on public.visit_photos;

-- 넣기(0086)는 그대로 — 올린 사람은 나로만. 설명 · 순서 고치기와 지우기는 멤버 누구나
create policy "visit_photos_update" on public.visit_photos
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

create policy "visit_photos_delete" on public.visit_photos
  for delete to authenticated
  using (public.is_trip_member(trip_id));

drop index public.visit_photos_item_idx;
create index visit_photos_item_idx on public.visit_photos(item_id);

create or replace function public.visit_photo_guard()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if (new.item_id, new.trip_id, new.user_id, new.photo_key, new.thumb_key)
       is distinct from (old.item_id, old.trip_id, old.user_id, old.photo_key, old.thumb_key) then
      raise exception 'visit_photos: 설명 · 순서만 바꾼다' using errcode = 'check_violation';
    end if;
    return new;
  end if;
  -- 보이지 않는 일정(남의 여행)은 여기서 거르지 않는다 — RLS · FK 가 거부한다
  if exists (
    select 1 from public.schedule_items where id = new.item_id and kind <> 'place'
  ) then
    raise exception 'visit_photos: 장소 일정에만 사진을 붙인다' using errcode = 'check_violation';
  end if;
  -- 같은 일정의 넣기를 차례로 — 일행이 동시에 넣어도 10장을 넘지 않게
  perform pg_advisory_xact_lock(hashtextextended(new.item_id::text, 0));
  if (select count(*) from public.visit_photos p where p.item_id = new.item_id) >= 10 then
    raise exception 'visit photo limit' using errcode = '23514';
  end if;
  return new;
end $$;
