-- 노트 › 쇼핑의 참고 사진 (#16 쇼핑 ②).
--
-- 항목 하나에 사진 한 장. 화면이 긴 변 1600 으로 줄인 사진(photo_key)과 목록용 썸네일(thumb_key, 긴 변 192)을 함께 올려
-- 둘 다 있거나 둘 다 없다. 준비물 · 쇼핑이 같은 테이블이라 칸은 둘 다 있지만, 화면은 쇼핑에서만 쓴다.
--   * 키는 그 여행 폴더 안(`{여행 id}/…`) — 다른 여행 파일을 가리키지 못하게(keys_in_trip, 0059)
--   * 두 키 모두 줄마다 겹치지 않는다 — 항목을 지우거나 사진을 바꿀 때 그 키를 바로 지워도 다른 줄의 사진이 사라지지 않게
--   * 파일은 화면이 지운다(항목 · 그룹 삭제, 사진 교체 · 삭제). 여행 삭제로 남는 파일은 #155

alter table public.pack_items
  add column photo_key text unique,
  add column thumb_key text unique,
  add constraint pack_items_photo_chk check (num_nonnulls(photo_key, thumb_key) in (0, 2)),
  add constraint pack_items_photo_keys_chk check (
    public.keys_in_trip(array_remove(array[photo_key, thumb_key], null), trip_id)
  );

-- ---------- 저장소(개발 중 Supabase Storage, 최종 R2) ----------
-- 비공개 버킷. 화면에서 줄인 사진만 받는다(JPEG, 줄인 것이 더 크면 원본 PNG · WebP). 보통 수백 KB 라 한 장 5MB 까지
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pack-photos', 'pack-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 경로 첫 칸(여행 id)의 멤버만 올리고 · 보고 · 지운다. 지우기는 읽기 정책으로 먼저 찾으므로 select 도 둔다(files.md 「함정」)
create policy "pack_photos_member_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'pack-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "pack_photos_member_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pack-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "pack_photos_member_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pack-photos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
