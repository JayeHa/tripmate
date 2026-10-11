-- 일정 추가 「내 숙소」(#88 ②-b): 담을 곳에 숙소를 더한다 — { "stay_id": uuid } 는 그 숙소의 연결 카드로 담는다.
-- 장소는 숙소의 장소, 아이콘 · 예약 상태는 숙소 것을 복사한다(그 뒤로는 sync_stay_cards 가 맞춘다).
-- 숙소는 같은 여행 것만 — RLS 로 안 보이거나 다른 여행이면 거부한다(복합 FK (stay_id, trip_id) 도 막는다). 그 밖은 0016 과 같다.
create or replace function public.add_schedule_places(p_trip uuid, p_day int, p_places jsonb)
returns uuid[]
language plpgsql security invoker set search_path = '' as $$
declare
  v_entry jsonb;
  v_item uuid;
  v_items uuid[] := '{}';
  v_stay public.stays;
begin
  if jsonb_typeof(p_places) is distinct from 'array' then
    raise exception 'places must be an array';
  end if;

  for v_entry in select value from jsonb_array_elements(p_places) with ordinality order by ordinality
  loop
    if v_entry ? 'stay_id' then
      select * into v_stay from public.stays where id = (v_entry ->> 'stay_id')::uuid and trip_id = p_trip;
      if v_stay.id is null then
        raise exception 'stay not found or not a member';
      end if;
      insert into public.schedule_items (
        trip_id, day_index, position, kind, place_id, stay_id, emoji, status, created_by
      ) values (
        p_trip, p_day,
        (select coalesce(max(position) + 1, 0) from public.schedule_items
          where trip_id = p_trip and day_index = p_day),
        'place', v_stay.place_id, v_stay.id, v_stay.emoji, v_stay.status, auth.uid()
      )
      returning id into v_item;
    elsif v_entry ? 'place_id' then
      insert into public.schedule_items (trip_id, day_index, position, kind, place_id, created_by)
      values (
        p_trip, p_day,
        (select coalesce(max(position) + 1, 0) from public.schedule_items
          where trip_id = p_trip and day_index = p_day),
        'place', (v_entry ->> 'place_id')::uuid, auth.uid()
      )
      returning id into v_item;
    else
      v_item := public.add_schedule_place(p_trip, p_day, v_entry);
    end if;
    v_items := v_items || v_item;
  end loop;
  return v_items;
end $$;
