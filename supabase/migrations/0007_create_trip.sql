-- 여행과 그 도시를 한 트랜잭션으로 만든다. 클라이언트에서 두 번 insert 하면
-- 두 번째가 실패했을 때 도시 없는 여행이 남는다.
--
-- security invoker 다. 호출자 권한 그대로 RLS 가 걸리므로 trips_insert_owner(owner_id = auth.uid())
-- 와 trip_cities_insert(is_trip_member) 가 그대로 지켜진다. 익명(둘러보기)도 자기 여행만 만든다.
create function public.create_trip(p_title text, p_start date, p_end date, p_city_ids text[])
returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_trip_id uuid;
begin
  if coalesce(array_length(p_city_ids, 1), 0) = 0 then
    raise exception 'at least one city is required';
  end if;

  insert into public.trips (owner_id, title, start_date, end_date)
  values (auth.uid(), p_title, p_start, p_end)
  returning id into v_trip_id;

  -- on_trip_created 트리거가 방금 소유자를 멤버로 넣었으므로 is_trip_member 를 통과한다.
  insert into public.trip_cities (trip_id, city_id, position)
  select v_trip_id, city_id, (ord - 1)::smallint
  from unnest(p_city_ids) with ordinality as picked(city_id, ord);

  return v_trip_id;
end $$;

revoke all on function public.create_trip(text, date, date, text[]) from public;
grant execute on function public.create_trip(text, date, date, text[]) to authenticated;
