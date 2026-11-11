-- 다녀온 장소의 기록 사진 (#313 f-3).
--
-- 기록 창에서 다녀온 장소에 붙이는 사진과 사진별 설명(40자). 기록 글(0085)과 같이 사람마다 따로 —
-- 지금 화면은 내 것만 보여 주지만 일행 사진을 나중에 보여 줄 수 있게 멤버가 함께 읽는다.
--   * 화면이 긴 변 1600 으로 줄인 사진(photo_key)과 카드용 썸네일(thumb_key, 긴 변 192)을 함께 올린다(택스 리펀 사진 0080 과 같다)
--   * 일정 × 사람에 10장까지(트리거). 놓는 순서는 position(같으면 올린 순)
--   * 넣기 · 바꾸기 · 지우기는 내 줄만. 바꿀 수 있는 것은 설명 · 순서뿐이다(트리거 — 키 · 일정 · 사람은 그대로)
--   * 장소 일정에만 붙는다(항공편 · 노트는 거부). 같은 여행의 일정에만 붙고 일정을 지우면 줄이 함께 지워진다(파일은 #155)
--   * 키는 그 여행 폴더 안(keys_in_trip, 0059) · 줄마다 겹치지 않는다
--
-- 권한: 여행 멤버. 익명(둘러보기)도 자기 여행이면 된다.

create table public.visit_photos (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null,
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  photo_key   text not null unique,
  thumb_key   text not null unique,
  caption     text check (char_length(btrim(caption)) >= 1 and char_length(caption) <= 40),
  position    smallint not null default 0,
  created_at  timestamptz not null default now(),
  foreign key (item_id, trip_id) references public.schedule_items (id, trip_id) on delete cascade,
  constraint visit_photos_keys_chk check (public.keys_in_trip(array[photo_key, thumb_key], trip_id))
);
create index visit_photos_item_idx on public.visit_photos(item_id, user_id);
create index visit_photos_trip_idx on public.visit_photos(trip_id);

create function public.visit_photo_guard()
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
  -- 같은 일정 × 사람의 넣기를 차례로 — 동시에 넣어도 10장을 넘지 않게
  perform pg_advisory_xact_lock(hashtextextended(new.item_id::text || new.user_id::text, 0));
  if (
    select count(*) from public.visit_photos p
    where p.item_id = new.item_id and p.user_id = new.user_id
  ) >= 10 then
    raise exception 'visit photo limit' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger visit_photos_guard before insert or update on public.visit_photos
  for each row execute function public.visit_photo_guard();

alter table public.visit_photos enable row level security;

create policy "visit_photos_select" on public.visit_photos
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "visit_photos_insert" on public.visit_photos
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy "visit_photos_update" on public.visit_photos
  for update to authenticated
  using (user_id = auth.uid() and public.is_trip_member(trip_id))
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy "visit_photos_delete" on public.visit_photos
  for delete to authenticated
  using (user_id = auth.uid() and public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.visit_photos;
alter table public.visit_photos replica identity full;

-- ---------- 저장소(개발 중 Supabase Storage, 최종 R2) ----------
-- 비공개 버킷. 화면에서 줄인 사진만 받는다(JPEG, 줄인 것이 더 크면 원본 PNG · WebP). 한 장 5MB 까지
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visit-photos', 'visit-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 경로 첫 칸(여행 id)의 멤버만 올리고 · 본다. 지우기는 붙은 줄이 없는 파일만 —
-- 줄은 내 것만 지울 수 있으니, 일행의 사진 파일을 줄보다 먼저 지우지 못하게. 화면은 줄을 지운 뒤 파일을 지운다
create policy "visit_photos_member_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'visit-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "visit_photos_member_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'visit-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "visit_photos_member_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'visit-photos'
    and public.is_trip_member(((storage.foldername(name))[1])::uuid)
    and not exists (
      select 1 from public.visit_photos v
      where v.photo_key = objects.name or v.thumb_key = objects.name
    )
  );
