-- 준비물 · 쇼핑 「기본 목록으로 시작」 은 목록이 비었을 때만 (#16, #206 리뷰).
--
-- 0060 의 add_pack_groups 는 기존 그룹 뒤에 붙였다. 일행 둘이 빈 화면에서 함께 누르거나 한 사람이 폰 · PC 에서 누르면
-- 기본 그룹이 두 벌 생기고 position 도 겹쳤다. 이제 그 여행 · 종류에 그룹이 하나라도 있으면 아무것도 하지 않는다.
-- 동시에 불려도 한쪽만 넣도록 여행 · 종류마다 트랜잭션 잠금을 먼저 잡는다 — 뒤에 온 쪽은 앞의 커밋 뒤에 그룹을 보고 끝난다.

create or replace function public.add_pack_groups(p_trip uuid, p_kind text, p_groups jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  g jsonb;
  gid uuid;
  i integer := 0;
begin
  if jsonb_typeof(p_groups) <> 'array' or jsonb_array_length(p_groups) > 20 then
    raise exception 'invalid groups' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('add_pack_groups:' || p_trip::text || ':' || p_kind));
  if exists (select 1 from public.pack_groups where trip_id = p_trip and kind = p_kind) then
    return;
  end if;
  for g in select * from jsonb_array_elements(p_groups) loop
    insert into public.pack_groups (trip_id, kind, name, position)
      values (p_trip, p_kind, g->>'name', i)
      returning id into gid;
    insert into public.pack_items (trip_id, group_id, name, position)
      select p_trip, gid, item.value, item.ordinality - 1
        from jsonb_array_elements_text(coalesce(g->'items', '[]'::jsonb))
          with ordinality as item(value, ordinality);
    i := i + 1;
  end loop;
end;
$$;
