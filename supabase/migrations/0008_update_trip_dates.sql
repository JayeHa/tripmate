-- 여행 기간을 바꾼다. 일정은 출발일 기준 day_index 라 날짜를 옮기면 함께 옮겨진다.
-- 기간을 줄여 잘려 나가는 날의 일정은 버리지 않고 새 마지막 날 끝으로 옮긴다(원래 순서 유지).
-- 날짜 변경과 일정 이동이 한 트랜잭션이라, 하나만 반영되는 일이 없다.
--
-- security invoker: trips_update_member · items_all(멤버) RLS 가 그대로 걸린다.
-- RLS 로 0행이 바뀌면 조용히 성공하지 않고 예외를 던진다(#30 과 같은 함정).
create function public.update_trip_dates(p_trip_id uuid, p_start date, p_end date)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_days int := p_end - p_start + 1;
  v_base int;
begin
  if v_days < 1 then
    raise exception 'end date must not be before start date';
  end if;

  update public.trips set start_date = p_start, end_date = p_end where id = p_trip_id;
  if not found then
    raise exception 'trip not found or not a member';
  end if;

  -- 새 마지막 날에 이미 있는 일정 뒤에 붙인다
  select coalesce(max(position), -1) + 1 into v_base
  from public.schedule_items
  where trip_id = p_trip_id and day_index = v_days - 1;

  update public.schedule_items s
  set day_index = v_days - 1, position = v_base + moved.ord - 1
  from (
    select id, row_number() over (order by day_index, position, created_at) as ord
    from public.schedule_items
    where trip_id = p_trip_id and day_index >= v_days
  ) moved
  where s.id = moved.id;

  -- 사라진 날의 경로 캐시는 지운다. 마지막 날은 일정이 바뀌어 해시가 달라지므로 다시 계산된다.
  delete from public.day_routes where trip_id = p_trip_id and day_index >= v_days;
end $$;

revoke all on function public.update_trip_dates(uuid, date, date) from public;
grant execute on function public.update_trip_dates(uuid, date, date) to authenticated;
