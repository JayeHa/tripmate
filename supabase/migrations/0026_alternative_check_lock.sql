-- 대체 장소를 넣는 것과 바꾸기 · 날짜 옮기기가 겹칠 때 막기.
--
-- 0025 는 바꾸기끼리만 직렬화했다. check_schedule_alternative 트리거는 붙을 일정을 잠그지 않고 읽어서, 바꾸기가
-- 커밋되기 전의 그 일정(아직 타임라인 줄)을 보고 통과했다 — 바꾸기가 끝나면 새 줄은 「대체 장소의 대체 장소」 가 됐다.
-- 붙을 일정을 for share 로 잠가 바꾸기 · 옮기기가 끝난 뒤의 값을 보게 한다. 그 밖은 0024 와 같다.
-- PGlite 는 연결이 하나라 이 경합을 재현하지 못한다.

create or replace function public.check_schedule_alternative()
returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  v_day int;
  v_parent uuid;
  v_kind text;
begin
  if new.alternative_of is null then
    return new;
  end if;
  -- 붙을 일정을 for share 로 잠그고 읽는다. 그 일정이 바꾸기(swap_alternative 가 for update) · 다른 날로 옮기기 중이면
  -- 끝날 때까지 기다렸다가 바뀐 값을 본다 — 잠그지 않으면 방금 대체 장소가 된 줄에 붙거나(대체 장소의 대체 장소,
  -- 어디에도 안 보이고 지울 길도 없다) 옮기기 전의 날짜로 들어간다
  select day_index, alternative_of, kind into v_day, v_parent, v_kind
  from public.schedule_items where id = new.alternative_of for share;
  if v_kind is distinct from 'place' then
    raise exception 'alternatives belong to a place item';
  end if;
  if v_parent is not null then
    raise exception 'an alternative cannot have alternatives';
  end if;
  if exists (select 1 from public.schedule_items where alternative_of = new.id) then
    raise exception 'an item with alternatives cannot become an alternative';
  end if;
  new.day_index := coalesce(v_day, new.day_index);
  return new;
end $$;
