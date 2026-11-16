-- 기록 영상 표지 바꾸기 (#313 5차 영상 ③).
--
-- 영상 줄의 표지(photo_key · thumb_key)와 표지로 쓴 장면(poster_at)을 바꿀 수 있게 한다 — 기록 창의 「🎞 표지 바꾸기」.
-- 화면이 고른 장면을 사진처럼 줄여 새 키로 올리고, 줄의 세 칸을 한 번에 바꾼 뒤 옛 표지 파일을 지운다(붙은 줄이 없어진 파일).
--   * 사진 줄은 그대로 설명 · 순서만 바꾼다 — 사진을 바꾸는 것은 지우고 새로 올리기다
--   * 영상 원본 · 길이 · 올린 사람 · 일정은 그대로다
--   * 바꾸는 사람은 멤버 누구나(설명 · 순서와 같다, 0088). 새 키도 그 여행 폴더여야 한다(visit_photos_keys_chk 가 바꾸기에도 걸린다)

create or replace function public.visit_photo_guard()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if (new.item_id, new.trip_id, new.user_id, new.video_key, new.duration)
       is distinct from
       (old.item_id, old.trip_id, old.user_id, old.video_key, old.duration)
       or (old.video_key is null
           and (new.photo_key, new.thumb_key, new.poster_at)
               is distinct from (old.photo_key, old.thumb_key, old.poster_at)) then
      raise exception 'visit_photos: 설명 · 순서 · 영상 표지만 바꾼다' using errcode = 'check_violation';
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
