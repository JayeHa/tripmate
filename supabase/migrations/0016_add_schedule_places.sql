-- 「일정 추가」 화면에서 고른 여러 곳을 한 번에, 고른 순서대로 그날 끝에 담는다.
-- 한 곳은 둘 중 하나다.
--   { "place_id": uuid }                                    — 저장한 장소(이미 있는 places 행)
--   { "name", "google_place_id"?, "lat"?, "lng"?, "address"? } — 구글 검색 · 이름만 입력(0015 add_schedule_place 와 같은 모양)
-- 한 트랜잭션이라 중간에 하나가 실패하면 아무것도 남지 않는다. 담은 일정 id 를 순서대로 돌려준다.
-- security invoker 라 RLS 가 그대로 걸린다: 저장한 장소는 can_attach_place(내 장소 · 이 여행이 쓰는 장소)를 통과해야 한다.
create function public.add_schedule_places(p_trip uuid, p_day int, p_places jsonb)
returns uuid[]
language plpgsql security invoker set search_path = '' as $$
declare
  v_entry jsonb;
  v_item uuid;
  v_items uuid[] := '{}';
begin
  if jsonb_typeof(p_places) is distinct from 'array' then
    raise exception 'places must be an array';
  end if;

  for v_entry in select value from jsonb_array_elements(p_places) with ordinality order by ordinality
  loop
    if v_entry ? 'place_id' then
      insert into public.schedule_items (trip_id, day_index, position, kind, place_id, created_by)
      values (
        p_trip, p_day,
        (select coalesce(max(position) + 1, 0) from public.schedule_items
          where trip_id = p_trip and day_index = p_day),
        'place', (v_entry ->> 'place_id')::uuid, auth.uid()
      )
      returning id into v_item;
    else
      v_item := public.add_schedule_place(p_trip, p_day, v_entry);
    end if;
    v_items := v_items || v_item;
  end loop;
  return v_items;
end $$;
revoke all on function public.add_schedule_places(uuid, int, jsonb) from public;
grant execute on function public.add_schedule_places(uuid, int, jsonb) to authenticated;
