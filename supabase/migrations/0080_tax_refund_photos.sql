-- 택스 리펀 사진 (#300 ②).
--
-- 환급 한 건에 사진 여러 장 — 영수증 · 물품 · 캡처(사업자 화면 · QR · 면세 양식 바코드). 일행이 함께 보고 올리고 지운다.
--   * 화면이 긴 변 1600 으로 줄인 사진(photo_key)과 목록용 썸네일(thumb_key, 긴 변 192)을 함께 올린다(쇼핑 사진 0062 와 같다)
--   * 키는 그 여행 폴더 안(keys_in_trip, 0059) · 줄마다 겹치지 않는다 — 지울 때 그 키를 바로 지워도 다른 줄의 사진이 사라지지 않게
--   * 한 건에 6장까지(트리거). 환급 기록을 지우면 줄은 함께 지워지고(cascade) 파일은 화면이 지운다. 여행 삭제로 남는 파일은 #155

create table public.tax_refund_photos (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  refund_id   uuid not null references public.tax_refunds(id) on delete cascade,
  kind        text not null check (kind in ('receipt', 'item', 'capture')),
  photo_key   text not null unique,
  thumb_key   text not null unique,
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint tax_refund_photos_keys_chk check (public.keys_in_trip(array[photo_key, thumb_key], trip_id))
);
create index tax_refund_photos_refund_idx on public.tax_refund_photos(refund_id);
create index tax_refund_photos_trip_idx on public.tax_refund_photos(trip_id);

-- 같은 여행의 환급 기록에만 붙고, 한 건에 6장까지. 동시에 넣어도 넘지 않게 그 기록 줄을 잠근다
create function public.tax_refund_photos_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.tax_refunds r where r.id = new.refund_id and r.trip_id = new.trip_id for update;
  if not found then
    raise exception 'refund not found' using errcode = '23503';
  end if;
  if (select count(*) from public.tax_refund_photos p where p.refund_id = new.refund_id) >= 6 then
    raise exception 'refund photo limit' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tax_refund_photos_guard before insert on public.tax_refund_photos
  for each row execute function public.tax_refund_photos_guard();

alter table public.tax_refund_photos enable row level security;

-- 멤버만. 익명도 자기 여행이면 된다(둘러보기). 고치기는 없다(지우고 다시 올린다)
create policy "tax_refund_photos_select" on public.tax_refund_photos
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "tax_refund_photos_insert" on public.tax_refund_photos
  for insert to authenticated with check (public.is_trip_member(trip_id));
create policy "tax_refund_photos_delete" on public.tax_refund_photos
  for delete to authenticated using (public.is_trip_member(trip_id));

alter publication supabase_realtime add table public.tax_refund_photos;
alter table public.tax_refund_photos replica identity full;

-- ---------- 저장소(개발 중 Supabase Storage, 최종 R2) ----------
-- 비공개 버킷. 화면에서 줄인 사진만 받는다(JPEG, 줄인 것이 더 크면 원본 PNG · WebP). 한 장 5MB 까지
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('refund-photos', 'refund-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 경로 첫 칸(여행 id)의 멤버만 올리고 · 보고 · 지운다. 지우기는 읽기 정책으로 먼저 찾으므로 select 도 둔다
create policy "refund_photos_member_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'refund-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "refund_photos_member_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'refund-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "refund_photos_member_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'refund-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
