-- 숙소 · 항공편 결제를 넣는 사이 그 숙소 · 항공편이 지워졌을 때 알아볼 수 있는 오류를 낸다 (#192 리뷰).
--
-- 0051 · 0055 의 트리거는 이름을 숙소 · 항공편에서 읽는데, 없으면 이름이 null 이 되어 FK 검사보다 먼저
-- NOT NULL(23502) 로 실패하고 영문 원시 오류가 화면에 그대로 보였다. 없으면 23503 과 'stay not found' · 'flight not found' 로
-- 멈춘다 — 화면(createExpense)이 「지워졌어요」 로 바꾼다. 그 밖은 0051 · 0055 와 같다. 인자가 같아 create or replace

create or replace function public.set_stay_expense_fields()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.stay_id is null then
    return new;
  end if;
  select left(p.name, 100) into new.name
  from public.stays s join public.places p on p.id = s.place_id
  where s.id = new.stay_id;
  if not found then
    raise exception 'stay not found' using errcode = '23503';
  end if;
  new.category := 'lodging';
  new.schedule_item_id := null;
  return new;
end $$;

create or replace function public.set_flight_expense_fields()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.flight_id is null then
    return new;
  end if;
  select public.flight_expense_name(f) into new.name from public.flights f where f.id = new.flight_id;
  if not found then
    raise exception 'flight not found' using errcode = '23503';
  end if;
  new.category := 'flight';
  new.schedule_item_id := null;
  return new;
end $$;
