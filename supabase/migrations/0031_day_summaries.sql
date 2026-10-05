-- 하루 요약 — 날마다 한 줄(「파르코 라멘 → 파크 14:00 → 굿즈 쇼핑」). 일정 편집에서 쓰고 day 헤더 · PC 날짜 레일에 보인다.
--
-- trips.day_summaries[day_index + 1] 에 둔다(배열은 1부터). 비운 날은 null, 기간보다 긴 칸은 보이지 않을 뿐 지우지 않는다
-- (일정처럼 day_index 기준이라 출발일을 옮겨도 그 날짜 차례에 그대로 남는다).
-- 「완료」 에서 순서와 함께 한 번에 저장하려고 apply_schedule_edit 에 p_summaries 를 더한다 — 인자가 늘어 지우고 다시 만든다.
-- 권한은 그대로 RLS(여행 멤버, trips_update_member) — security invoker.

alter table public.trips add column day_summaries text[] not null default '{}';

drop function public.apply_schedule_edit(uuid, jsonb, uuid[]);

-- p_summaries : { "<day_index>": "요약" } — 바꾼 날만. 빈 글은 null 로(그날 요약을 지운다). 100자까지
create function public.apply_schedule_edit(p_trip uuid, p_days jsonb, p_deletes uuid[], p_summaries jsonb)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_day text;
  v_ids uuid[];
  v_count int;
  v_text text;
begin
  if p_deletes is not null and cardinality(p_deletes) > 0 then
    delete from public.schedule_items
    where trip_id = p_trip and alternative_of is null and id = any(p_deletes);
  end if;

  for v_day, v_ids in
    select key, array(select jsonb_array_elements_text(value)::uuid) from jsonb_each(coalesce(p_days, '{}'::jsonb))
  loop
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
    if v_day::int < 0 then
      raise exception 'day index must not be negative';
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
