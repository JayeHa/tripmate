-- 일반 메모(note 일정)의 사진 (노선도 6차 메모 카드 ②-c).
--
-- 메모 창의 첨부 바 「📷 사진」 으로 붙인다. 사진 표를 따로 두지 않고 메모 줄의 칸에 둔다(2026-11-25 사용자 결정) —
-- 글 · 링크 · 사진이 한 번에 저장되고, 일행이 같은 메모를 함께 고치면 나중 저장이 이긴다(링크와 같다).
--   * photos = [{ photo_key, thumb_key }] — 0번 = 대표. 10장까지
--   * 파일은 기록 사진과 같은 버킷 `visit-photos`(0086)에 같은 크기 · 종류로 둔다(긴 변 1600 + 썸네일 192)
--   * 키는 그 여행 폴더 안(keys_in_trip, 0059). note 일정에만 붙는다
--   * 버킷의 지우기 정책은 메모 칸이 가리키는 파일도 지우지 못하게 넓힌다 — 줄(칸)을 먼저 고친 뒤 파일을 지운다
--
-- 권한: 메모 줄과 같다(여행 멤버, 익명도 자기 여행이면).

-- 메모 사진 칸이 맞는 모양인가 — 배열 · 10장 이하 · 원소마다 두 키(문자열) · 키가 모두 그 여행 폴더 안
create function public.memo_photos_ok(p_photos jsonb, p_trip uuid)
returns boolean
language sql immutable set search_path = '' as $$
  -- 배열이 아니면 jsonb_array_length 가 오류를 내서 case 로 먼저 거른다(and 는 순서를 보장하지 않는다)
  select case when jsonb_typeof(p_photos) <> 'array' then false
    else jsonb_array_length(p_photos) <= 10
     and coalesce((
       -- 원소가 객체가 아니면 null 이 나온다 — bool_and 는 null 을 건너뛰므로 원소마다 false 로 바꾼다
       select bool_and(coalesce(
         jsonb_typeof(e -> 'photo_key') = 'string' and jsonb_typeof(e -> 'thumb_key') = 'string'
         and public.keys_in_trip(array[e ->> 'photo_key', e ->> 'thumb_key'], p_trip),
         false
       ))
       from jsonb_array_elements(p_photos) e
     ), true)
  end
$$;

alter table public.schedule_items
  add column photos jsonb not null default '[]'::jsonb,
  add constraint schedule_items_photos_chk check (public.memo_photos_ok(photos, trip_id)),
  add constraint schedule_items_photos_note_chk check (kind = 'note' or photos = '[]'::jsonb);

-- 붙은 줄이 없는 파일만 지운다 — 기록 사진 줄에 더해 메모 사진 칸도 본다
drop policy "visit_photos_member_delete" on storage.objects;
create policy "visit_photos_member_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'visit-photos'
    and public.is_trip_member(((storage.foldername(name))[1])::uuid)
    and not exists (
      select 1 from public.visit_photos v
      where v.photo_key = objects.name or v.thumb_key = objects.name
    )
    and not exists (
      select 1 from public.schedule_items s
      where s.trip_id = ((storage.foldername(objects.name))[1])::uuid
        and s.kind = 'note'
        and (s.photos @> jsonb_build_array(jsonb_build_object('photo_key', objects.name))
          or s.photos @> jsonb_build_array(jsonb_build_object('thumb_key', objects.name)))
    )
  );
