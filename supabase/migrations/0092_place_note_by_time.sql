-- 시간을 적은 일반 메모(note 일정)를 그 시각 자리로 옮긴다(노선도 6차 메모 카드).
-- 자리 = 그날 순서에서 메모 시각보다 늦은 첫 일정(장소 · 항공편) 바로 앞. 그런 일정이 없으면 그날 맨 끝.
-- 시간 없는 일정은 건너뛴다. 새로 만들거나 시간을 바꿔 저장할 때 한 번만 부르고,
-- 뒤에 장소 시간을 바꿔도 메모는 따라 움직이지 않는다 — 일정 편집으로 옮긴 자리를 지킨다(2026-11-23 사용자 결정).
-- 시간이 없는 메모는 그대로 둔다. 권한은 일정 수정과 같은 RLS(여행 멤버) — security invoker.
create or replace function public.place_note_by_time(p_item uuid)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_note public.schedule_items;
  v_pos int;
begin
  select * into v_note from public.schedule_items where id = p_item and kind = 'note';
  if not found then
    raise exception 'place_note_by_time: 메모가 없다' using errcode = 'no_data_found';
  end if;
  if v_note.start_time is null then
    return;
  end if;

  select position into v_pos from public.schedule_items
   where trip_id = v_note.trip_id and day_index = v_note.day_index
     and alternative_of is null and kind <> 'note' and id <> p_item
     and start_time > v_note.start_time
   order by position, created_at
   limit 1;

  if v_pos is null then
    select coalesce(max(position) + 1, 0) into v_pos from public.schedule_items
     where trip_id = v_note.trip_id and day_index = v_note.day_index
       and alternative_of is null and id <> p_item;
  else
    update public.schedule_items set position = position + 1
     where trip_id = v_note.trip_id and day_index = v_note.day_index
       and alternative_of is null and id <> p_item and position >= v_pos;
  end if;

  update public.schedule_items set position = v_pos where id = p_item;
end $$;
