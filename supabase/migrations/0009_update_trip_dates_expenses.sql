-- update_trip_dates(0008) 가 지출을 옮기지 않던 것을 고친다.
-- 지출도 일정처럼 「여행 며칠째」에 속한다(시안 데이터 모델 Expense.day). 날짜만 spent_on 으로
-- 저장해 두었을 뿐이라, 여행을 옮기면 지출이 기간 밖에 남아 폼·목록에서 다룰 수 없었다.
--
-- - 출발일이 옮겨진 만큼 지출 날짜도 옮긴다
-- - 기간을 줄여 새 도착일보다 뒤에 남는 지출은 도착일로 모은다(일정을 마지막 날로 옮기는 것과 같다)
-- 반환·인자가 같아 create or replace 로 바꾼다. 권한(revoke/grant)은 0008 그대로 유지된다.
create or replace function public.update_trip_dates(p_trip_id uuid, p_start date, p_end date)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_days int := p_end - p_start + 1;
  v_old_start date;
  v_base int;
begin
  if v_days < 1 then
    raise exception 'end date must not be before start date';
  end if;

  -- 옮기기 전 출발일. RLS 로 안 보이면 아래 update 가 0행이라 같은 예외로 끝난다
  select start_date into v_old_start from public.trips where id = p_trip_id;

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

  -- 지출: 출발일이 옮겨진 만큼 함께 옮기고, 새 도착일을 넘는 것은 도착일로 모은다
  update public.expenses
  set spent_on = least(spent_on + (p_start - v_old_start), p_end)
  where trip_id = p_trip_id;

  -- 사라진 날의 경로 캐시는 지운다. 마지막 날은 일정이 바뀌어 해시가 달라지므로 다시 계산된다.
  delete from public.day_routes where trip_id = p_trip_id and day_index >= v_days;
end $$;
