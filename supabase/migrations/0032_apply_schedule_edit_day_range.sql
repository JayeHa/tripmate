-- apply_schedule_edit(0031) 의 날 번호에 위 한계를 둔다 — 0 ≤ day < 여행 일수(end_date - start_date + 1).
--
-- - 하루 요약: 큰 번호 하나({"2000000000": "x"})로 요약 배열을 그만큼 다시 만들던 것을 막는다
-- - 순서: 편집 중 일행이 기간을 줄였는데 옛 초안으로 저장하면 기간 밖 day_index 로 써서 타임라인에서 사라지던 것을 막는다
-- 인자가 같아 create or replace. 권한은 그대로 RLS(여행 멤버) — security invoker.

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
  -- 여행 일수. 날 번호는 0 ≤ day < 일수 만 받는다 — 위 한계가 없으면 큰 번호 하나로 요약 배열을 그만큼 만들고,
  -- 편집 중 기간이 줄었는데 옛 초안으로 저장하면 기간 밖 day_index 로 써서 타임라인에서 사라진다
  select end_date - start_date + 1 into v_days from public.trips where id = p_trip;
  if v_days is null then
    raise exception 'trip not found or not a member';
  end if;

  if p_deletes is not null and cardinality(p_deletes) > 0 then
    delete from public.schedule_items
    where trip_id = p_trip and alternative_of is null and id = any(p_deletes);
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

    -- 목록 순서대로 0, 1, 2 …
    update public.schedule_items s
    set day_index = v_day::int, position = o.n - 1
    from unnest(v_ids) with ordinality as o(id, n)
    where s.id = o.id;

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
    -- 칸을 하나씩 다시 만들어 1 부터 시작하는 배열로 둔다. 빈 배열에 [3] 만 넣으면 [3:3] 배열이 되어
    -- 클라이언트(JSON)에서는 첫 칸이 되어 버린다
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
