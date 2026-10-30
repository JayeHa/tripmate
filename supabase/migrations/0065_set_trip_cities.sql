-- 여행 도시를 통째로 바꾼다 — 여행 홈 「편집 › 여행 도시 추가 및 편집」.
--
-- 화면에서 지우기 · 넣기를 따로 부르면 두 번째가 실패했을 때 도시 없는 여행이 남는다. 한 트랜잭션으로 묶는다.
-- 고른 순서가 position 이 된다(첫 도시 = 지도 중심 · 여행 홈 위젯의 통화 · 시간대 · 공휴일 나라).
-- 뺀 도시의 일정 · 장소는 그대로 둔다(일정은 여행에, 장소는 도시에 붙는다). 남는 일정 수는 화면이 미리 알린다.
--
-- security invoker 라 trip_cities_* 정책(멤버)이 그대로 걸린다. 멤버가 아니면 지우기가 0행으로 조용히 지나가므로 먼저 거부한다.
-- 두 멤버가 동시에 바꾸면 여행 행을 잠가 차례로 적용한다(나중 것이 이긴다). 잠그지 않으면 두 목록이 섞이거나 키가 부딪힌다.
create function public.set_trip_cities(p_trip_id uuid, p_city_ids text[])
returns void
language plpgsql security invoker set search_path = public as $$
begin
  if coalesce(array_length(p_city_ids, 1), 0) = 0 then
    raise exception 'at least one city is required';
  end if;
  if (select count(distinct c) from unnest(p_city_ids) as c) <> array_length(p_city_ids, 1) then
    raise exception 'duplicate city';
  end if;
  if not public.is_trip_member(p_trip_id) then
    raise exception 'trip not found or not a member';
  end if;

  perform 1 from public.trips where id = p_trip_id for update;

  delete from public.trip_cities where trip_id = p_trip_id;
  insert into public.trip_cities (trip_id, city_id, position)
  select p_trip_id, city_id, (ord - 1)::smallint
  from unnest(p_city_ids) with ordinality as picked(city_id, ord);
end $$;

revoke all on function public.set_trip_cities(uuid, text[]) from public;
grant execute on function public.set_trip_cities(uuid, text[]) to authenticated;
