-- 기록 영상 (#313 5차).
--
-- 기록 사진 줄(visit_photos, 0086 · 0088)에 짧은 영상을 함께 둔다. 사진과 합쳐 일정에 10개 — 트리거가 줄 수를 세므로 그대로다.
--   * 영상 줄 = video_key 가 있는 줄. 그 줄의 photo_key · thumb_key 는 **표지**다(화면이 영상의 한 장면을 사진처럼 줄여 올린다).
--     사진만 아는 화면도 표지를 사진처럼 그린다
--   * duration = 길이(초). 30초까지인데, 폰이 30초로 찍은 영상이 30.0x 로 읽혀 31 미만까지 받는다
--   * poster_at = 표지로 쓴 장면(초). 화면이 처음에 1초 지점으로 정한다
--   * 원본을 그대로 올린다(서버에서 바꾸지 않는다). 새 비공개 버킷 `visit-videos` — 한 개 50MB · MP4 · MOV · WebM
--   * 바꿀 수 있는 것은 그대로 설명 · 순서뿐이다(표지 바꾸기는 그 화면을 만들 때 연다)
--
-- 권한: 줄은 사진과 같다(여행 멤버, 익명도 자기 여행이면). 영상 **파일 올리기는 익명(둘러보기)을 막는다** —
-- 한 개가 50MB 라, 매일 지워지는 계정이 저장 공간을 채우지 못하게(프로필 사진 0043 과 같은 검사).

alter table public.visit_photos
  add column video_key text unique,
  add column duration  real,
  add column poster_at real,
  -- 셋은 함께 있거나 함께 없다. null 비교가 통과로 읽히지 않게 coalesce 로 감싼다
  add constraint visit_photos_video_chk check (
    case
      when video_key is null then duration is null and poster_at is null
      else coalesce(duration > 0 and duration < 31 and poster_at >= 0 and poster_at <= duration, false)
    end
  ),
  add constraint visit_photos_video_key_chk check (
    video_key is null or public.keys_in_trip(array[video_key], trip_id)
  );

create or replace function public.visit_photo_guard()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if (new.item_id, new.trip_id, new.user_id, new.photo_key, new.thumb_key,
        new.video_key, new.duration, new.poster_at)
       is distinct from
       (old.item_id, old.trip_id, old.user_id, old.photo_key, old.thumb_key,
        old.video_key, old.duration, old.poster_at) then
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

-- ---------- 저장소(개발 중 Supabase Storage, 최종 R2) ----------
-- 비공개 버킷. 원본 그대로 한 개 50MB 까지. 사진 버킷(5MB · 사진 종류만)과 한도가 달라 따로 둔다
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visit-videos', 'visit-videos', false, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

-- 경로 첫 칸(여행 id)의 멤버만 올리고 · 본다. 올리기는 익명을 막는다. 지우기는 붙은 줄이 없는 파일만(사진 버킷과 같다)
create policy "visit_videos_member_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'visit-videos' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "visit_videos_member_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'visit-videos'
    and public.is_trip_member(((storage.foldername(name))[1])::uuid)
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  );
create policy "visit_videos_member_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'visit-videos'
    and public.is_trip_member(((storage.foldername(name))[1])::uuid)
    and not exists (select 1 from public.visit_photos v where v.video_key = objects.name)
  );
