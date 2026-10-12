-- 숙소 결제 ↔ 가계부 (#88 ③).
--
-- 숙소의 결제는 가계부 비용 한 건이다(expenses.stay_id). 숙소 화면과 가계부가 같은 줄을 보고 고친다.
--   * 숙소 하나에 비용은 하나(unique). 숙소를 지우면 비용도 지운다(cascade)
--   * 이름 · 카테고리는 숙소가 정한다 — 이름 = 숙소 장소 이름, 카테고리 = 숙소, 일정 연결 없음.
--     어느 경로로 저장하든 트리거가 덮어쓰고, 숙소의 장소가 바뀌거나 장소 이름이 바뀌면 따라간다
--   * 금액 · 통화 · 날짜 · 결제수단 · 결제 상태 · 사람 · 메모 · 영수증 · 합계 포함은 일반 비용처럼 고친다

alter table public.expenses
  add column stay_id uuid,
  -- 같은 여행의 숙소에만 붙는다(복합 FK). 숙소를 지우면 비용도 지운다
  add constraint expenses_stay_fkey foreign key (stay_id, trip_id)
    references public.stays(id, trip_id) on delete cascade,
  add constraint expenses_stay_key unique (stay_id);

-- 숙소 비용의 이름 · 카테고리 · 일정 연결을 숙소에 맞춘다
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
  new.category := 'lodging';
  new.schedule_item_id := null;
  return new;
end $$;

create trigger expenses_stay_fields before insert or update on public.expenses
  for each row execute function public.set_stay_expense_fields();

-- 숙소의 장소가 바뀌면(다른 곳으로 옮김 · 남의 장소를 고쳐 사본으로) 비용 이름이 따라간다
create or replace function public.sync_stay_expense_name()
returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  update public.expenses e set name = left(p.name, 100)
  from public.places p
  where e.stay_id = new.id and p.id = new.place_id;
  return new;
end $$;

create trigger stays_sync_expense after update of place_id on public.stays
  for each row execute function public.sync_stay_expense_name();

-- 장소 이름을 고치면(숙소 폼 · 일정의 「장소 정보 수정」) 그 장소를 쓰는 숙소들의 비용 이름이 따라간다.
-- 장소는 여러 여행이 함께 쓸 수 있고, 고친 사람이 그 여행의 멤버가 아닐 수 있어 definer 로 돈다 —
-- 하는 일은 숙소 비용의 이름을 장소 이름으로 맞추는 것뿐이다
create or replace function public.sync_place_stay_expenses()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.expenses e set name = left(new.name, 100)
  from public.stays s
  where s.place_id = new.id and e.stay_id = s.id and e.name is distinct from left(new.name, 100);
  return new;
end $$;

create trigger places_sync_stay_expenses after update of name on public.places
  for each row execute function public.sync_place_stay_expenses();
