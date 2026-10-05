-- swap_alternative 동시 실행 막기.
--
-- 0024 의 swap_alternative 는 두 줄을 잠그지 않고 읽었다. 두 멤버가 같은 일정의 서로 다른 대체 장소(alt1 · alt2)를
-- 동시에 바꾸면, 뒤에 커밋되는 쪽이 이미 바뀐 원래 일정의 옛 자리 · 시간을 써서 alt1 · alt2 가 같은 자리에 함께 올라갔다.
-- 원래 일정 줄을 for update 로 잠근 뒤 대체 장소가 아직 그 일정에 붙어 있는지 다시 확인한다. 그 밖은 0024 와 같다.

create or replace function public.swap_alternative(p_alt uuid)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_main public.schedule_items;
  v_alt public.schedule_items;
begin
  select * into v_alt from public.schedule_items where id = p_alt;
  if v_alt.id is null or v_alt.alternative_of is null then
    raise exception 'not an alternative';
  end if;
  -- 원래 일정 줄을 잠그고 대체 장소를 다시 읽는다. 같은 일정의 다른 대체 장소를 동시에 바꾸면 뒤에 온 쪽은 여기서 기다렸다가
  -- 이미 바뀐 것을 보고 거부된다(잠그지 않으면 두 대체 장소가 같은 자리에 함께 올라간다)
  select * into v_main from public.schedule_items where id = v_alt.alternative_of for update;
  select * into v_alt from public.schedule_items where id = p_alt for update;
  if v_alt.alternative_of is distinct from v_main.id then
    raise exception 'alternative already swapped';
  end if;

  update public.moves set from_item_id = v_alt.id where from_item_id = v_main.id;
  update public.moves set to_item_id = v_alt.id where to_item_id = v_main.id;

  update public.schedule_items set
    alternative_of = null, day_index = v_main.day_index, position = v_main.position, start_time = v_main.start_time
  where id = v_alt.id;
  update public.schedule_items set alternative_of = v_alt.id
  where alternative_of = v_main.id;
  update public.schedule_items set alternative_of = v_alt.id, start_time = null, position = v_alt.position
  where id = v_main.id;
  if not found then
    raise exception 'item not found or not a member';
  end if;
end $$;
