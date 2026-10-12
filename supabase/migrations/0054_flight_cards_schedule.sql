-- 항공편 ② 일정 쪽 (#89).
--
-- 1. 일정 편집 저장(apply_schedule_edit)에서 항공편 카드(flight_id 가 있는 줄)는 지우지 않고 다른 날로 옮기지 않는다.
--    화면은 이미 고르지 못하게 막지만(같은 날 안의 순서 끌기만 된다) API 는 열려 있다. 카드를 지우면 항공편만 남고,
--    다른 날로 옮기면 탑승일과 어긋난다. 거부하지 않고 건너뛴다 — 편집하는 동안 일행이 항공편 날짜를 바꿔 카드가 옮겨졌을 때
--    옛 초안으로 저장해도 다른 일정의 순서 · 삭제는 저장되게.
--    그날 목록에 있는데 지금 다른 날에 있는 카드는 그대로 두고, 그 자리 번호만 비운다(순서에는 영향 없다)
-- 2. 이미 있는 flight 일정(카드 연결 없는 옛 줄)을 항공편으로 옮긴다. 제목 「ICN 07:15 - NRT 09:40」 + 설명 「제주항공 · 7C1181」
--    형식이면 항공편을 만들고 그 줄을 카드로 잇는다(자리 · 메모 그대로). 아니면 옛 줄로 둔다(일반 일정 상세로 연다).
--    탑승일 = 여행 시작일 + 그 줄의 날. 도착일은 도착 시각이 출발 시각보다 앞서면 다음 날, 아니면 같은 날(옛 줄에는 날짜가 없다).
--    예약 상태는 줄의 것을 옮긴다

-- ---------- 1. 일정 편집 저장 ----------
-- 0032 와 같고, 지우기 · 날 바꾸기에서 항공편 카드를 뺀다. 인자가 같아 create or replace
create or replace function public.apply_schedule_edit(p_trip uuid, p_days jsonb, p_deletes uuid[], p_summaries jsonb)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_day text;
  v_ids uuid[];
  v_count int;
  v_text text;
  v_days int;
begin
  select end_date - start_date + 1 into v_days from public.trips where id = p_trip;
  if v_days is null then
    raise exception 'trip not found or not a member';
  end if;

  -- 항공편 카드는 지우지 않는다(항공편 창에서 항공편을 지우면 함께 지워진다)
  if p_deletes is not null and cardinality(p_deletes) > 0 then
    delete from public.schedule_items
    where trip_id = p_trip and alternative_of is null and flight_id is null and id = any(p_deletes);
  end if;

  for v_day, v_ids in
    select key, array(select jsonb_array_elements_text(value)::uuid) from jsonb_each(coalesce(p_days, '{}'::jsonb))
  loop
    if v_day::int < 0 or v_day::int >= v_days then
      raise exception 'day index out of trip range';
    end if;
    select count(*) into v_count from public.schedule_items
    where id = any(v_ids) and trip_id = p_trip and alternative_of is null;
    if v_count <> cardinality(v_ids) then
      raise exception 'items must be timeline items of this trip';
    end if;

    -- 목록 순서대로 0, 1, 2 … 항공편 카드는 지금 있는 날의 목록에서만 자리를 바꾼다
    update public.schedule_items s
    set day_index = v_day::int, position = o.n - 1
    from unnest(v_ids) with ordinality as o(id, n)
    where s.id = o.id and (s.flight_id is null or s.day_index = v_day::int);

    -- 목록에 없는 그날 일정(편집하는 동안 일행이 넣은 것)은 뒤에, 원래 순서대로
    update public.schedule_items s
    set position = cardinality(v_ids) + r.n - 1
    from (
      select id, row_number() over (order by position, created_at) n
      from public.schedule_items
      where trip_id = p_trip and day_index = v_day::int and alternative_of is null and not (id = any(v_ids))
    ) r
    where s.id = r.id;
  end loop;

  for v_day, v_text in select key, value from jsonb_each_text(coalesce(p_summaries, '{}'::jsonb))
  loop
    v_text := nullif(btrim(v_text), '');
    if v_day::int < 0 or v_day::int >= v_days then
      raise exception 'day index out of trip range';
    end if;
    if char_length(v_text) > 100 then
      raise exception 'day summary must be at most 100 characters';
    end if;
    update public.trips t
    set day_summaries = (
      select array_agg(case when i = v_day::int + 1 then v_text else t.day_summaries[i] end order by i)
      from generate_series(1, greatest(coalesce(array_length(t.day_summaries, 1), 0), v_day::int + 1)) i
    )
    where t.id = p_trip;
    if not found then
      raise exception 'trip not found or not a member';
    end if;
  end loop;
end $$;

-- ---------- 2. 옛 flight 줄 → 항공편 ----------
do $$
declare
  v_row record;
  v_m text[];
  v_d text[];
  v_dep date;
  v_flight uuid;
begin
  for v_row in
    select s.id, s.trip_id, s.day_index, s.name, s.description, s.status, s.created_by, t.start_date
    from public.schedule_items s join public.trips t on t.id = s.trip_id
    where s.kind = 'flight' and s.flight_id is null and s.alternative_of is null
  loop
    v_m := regexp_match(v_row.name, '^([A-Z]{3}) (([01][0-9]|2[0-3]):[0-5][0-9]) - ([A-Z]{3}) (([01][0-9]|2[0-3]):[0-5][0-9])$');
    v_d := regexp_match(coalesce(v_row.description, ''), '^(.{1,40}) · ([A-Z0-9]{2})([0-9]{1,4})$');
    continue when v_m is null or v_d is null or btrim(v_d[1]) = '';

    v_dep := v_row.start_date + v_row.day_index;
    insert into public.flights (
      trip_id, airline_name, airline_code, flight_no, dep_airport, arr_airport,
      dep_date, dep_time, arr_date, arr_time, status, created_by
    ) values (
      v_row.trip_id, btrim(v_d[1]), v_d[2], v_d[3], v_m[1], v_m[4],
      v_dep, v_m[2]::time,
      case when v_m[5]::time < v_m[2]::time then v_dep + 1 else v_dep end, v_m[5]::time,
      v_row.status, v_row.created_by
    )
    returning id into v_flight;

    -- 카드 글자 · 시각을 항공편에 맞춘다(sync_flight_card 와 같은 값)
    update public.schedule_items s
    set flight_id = v_flight,
        name = public.flight_card_name(f),
        description = public.flight_card_description(f),
        start_time = f.dep_time
    from public.flights f
    where s.id = v_row.id and f.id = v_flight;
  end loop;
end $$;
