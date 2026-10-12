-- 항공편 결제 ↔ 가계부 (#89 ③-b). 숙소 결제(0051)와 같은 모양이다.
--
-- 항공편의 결제는 가계부 비용 한 건이다(expenses.flight_id). 항공편 화면과 가계부가 같은 줄을 보고 고친다.
--   * 항공편 하나에 비용은 하나(unique). 항공편을 지우면 비용도 지운다(cascade)
--   * 이름 · 카테고리는 항공편이 정한다 — 이름 = 「제주항공 7C1181」, 카테고리 = 항공, 일정 연결 없음.
--     어느 경로로 저장하든 트리거가 덮어쓰고, 항공사 · 편명을 고치면 따라간다
--   * 숙소 결제이면서 항공편 결제일 수는 없다
--   * 이미 항공편 카드에 「일정 연결」 로 붙어 있던 비용은 그 항공편의 결제로 옮긴다(항공편마다 가장 먼저 만든 한 건 —
--     2026-10-13 사용자 결정). 나머지는 카드에 연결된 채 남는다(항공편 상세의 「연결된 비용」 에 보인다)

alter table public.expenses
  add column flight_id uuid,
  -- 같은 여행의 항공편에만 붙는다(복합 FK). 항공편을 지우면 비용도 지운다
  add constraint expenses_flight_fkey foreign key (flight_id, trip_id)
    references public.flights(id, trip_id) on delete cascade,
  add constraint expenses_flight_key unique (flight_id),
  add constraint expenses_one_owner_chk check (stay_id is null or flight_id is null);

-- 결제 이름 「제주항공 7C1181」
create or replace function public.flight_expense_name(f public.flights)
returns text
language sql immutable set search_path = '' as $$
  select left(f.airline_name || ' ' || f.airline_code || f.flight_no, 100);
$$;

-- 항공편 비용의 이름 · 카테고리 · 일정 연결을 항공편에 맞춘다
create or replace function public.set_flight_expense_fields()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.flight_id is null then
    return new;
  end if;
  select public.flight_expense_name(f) into new.name from public.flights f where f.id = new.flight_id;
  new.category := 'flight';
  new.schedule_item_id := null;
  return new;
end $$;

create trigger expenses_flight_fields before insert or update on public.expenses
  for each row execute function public.set_flight_expense_fields();

-- 항공사 · 편명을 고치면 결제 이름이 따라간다
create or replace function public.sync_flight_expense_name()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.expenses set name = public.flight_expense_name(new)
  where flight_id = new.id and name is distinct from public.flight_expense_name(new);
  return new;
end $$;

create trigger flights_sync_expense after update of airline_name, airline_code, flight_no on public.flights
  for each row execute function public.sync_flight_expense_name();

-- ---------- 이미 항공편 카드에 연결된 비용 → 항공편 결제 ----------
update public.expenses e
set flight_id = pick.flight_id
from (
  select distinct on (s.flight_id) s.flight_id, x.id
  from public.expenses x
  join public.schedule_items s on s.id = x.schedule_item_id
  where s.flight_id is not null and x.stay_id is null
    and not exists (select 1 from public.expenses p where p.flight_id = s.flight_id)
  order by s.flight_id, x.created_at, x.id
) pick
where e.id = pick.id;
