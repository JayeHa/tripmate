-- 여행 기간을 늘려 탑승일이 기간 안으로 들어온 항공편에 일정 카드를 만든다 (#89 ①, 0052 이어서).
--
-- 0052 의 「탑승일이 기간 안이면 그날에 카드 하나」 는 save_flight 만 맞췄다 — 기간을 늘려도 다시 저장하기 전까지 카드가 없었다.
-- 줄이는 쪽은 그대로 둔다(카드가 마지막 날로 모이고, 다음 저장 때 확인창을 거쳐 지운다).

create or replace function public.update_trip_dates(p_trip_id uuid, p_start date, p_end date)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_days int := p_end - p_start + 1;
  v_old_start date;
  v_base int;
  v_f public.flights;
begin
  if v_days < 1 then
    raise exception 'end date must not be before start date';
  end if;

  select start_date into v_old_start from public.trips where id = p_trip_id for update;

  update public.trips set start_date = p_start, end_date = p_end where id = p_trip_id;
  if not found then
    raise exception 'trip not found or not a member';
  end if;

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

  update public.expenses
  set spent_on = least(spent_on + (p_start - v_old_start), p_end)
  where trip_id = p_trip_id and spent_on is not null;

  update public.stays
  set check_in_date = check_in_date + (p_start - v_old_start),
      check_out_date = check_out_date + (p_start - v_old_start)
  where trip_id = p_trip_id;

  update public.flights
  set dep_date = dep_date + (p_start - v_old_start),
      arr_date = arr_date + (p_start - v_old_start)
  where trip_id = p_trip_id;

  -- 기간을 늘려 탑승일이 기간 안으로 들어온 항공편 — 카드가 없으면 그날 끝에 만든다(save_flight 와 같은 모양).
  -- 줄여서 기간 밖이 된 항공편의 카드는 지우지 않는다 — 마지막 날로 모인 채 남고, 다음 항공편 저장 때 물어보고 지운다(메모가 말없이 사라지지 않게)
  for v_f in
    select f.* from public.flights f
    where f.trip_id = p_trip_id and f.dep_date between p_start and p_end
      and not exists (
        select 1 from public.schedule_items si where si.flight_id = f.id and si.alternative_of is null
      )
    order by f.dep_date, f.dep_time, f.created_at
  loop
    insert into public.schedule_items (
      trip_id, day_index, position, kind, flight_id, name, description, start_time, status, created_by
    ) values (
      p_trip_id, v_f.dep_date - p_start,
      (select coalesce(max(position) + 1, 0) from public.schedule_items
        where trip_id = p_trip_id and day_index = v_f.dep_date - p_start),
      'flight', v_f.id, public.flight_card_name(v_f), public.flight_card_description(v_f),
      v_f.dep_time, v_f.status, auth.uid()
    );
  end loop;

  delete from public.day_routes where trip_id = p_trip_id and day_index >= v_days;
end $$;
