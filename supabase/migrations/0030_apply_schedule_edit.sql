-- 일정 편집 모드의 「완료」 — 편집하는 동안 모아 둔 순서 바꾸기 · 다른 날로 옮기기 · 지우기를 한 트랜잭션으로 저장한다.
--
-- p_days    : { "<day_index>": [일정 id, …] } — 손댄 날마다 그날 일정의 새 순서(옮겨 온 일정 포함). position 을 0 부터 다시 매긴다
-- p_deletes : 지울 일정 id
-- 편집하는 동안 일행이 그날에 새로 넣은 일정(목록에 없는 줄)은 지우지 않고 목록 뒤에 원래 순서대로 둔다.
-- 대체 장소 줄은 붙은 일정을 따라 날짜가 바뀐다(follow_alternative_day 트리거). 목록에 대체 장소 줄 · 다른 여행 일정이 있으면 거부.
-- 권한은 RLS(여행 멤버) — security invoker.

create or replace function public.apply_schedule_edit(p_trip uuid, p_days jsonb, p_deletes uuid[])
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_day text;
  v_ids uuid[];
  v_count int;
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
end $$;
