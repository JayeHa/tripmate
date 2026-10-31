-- 숙소 카드에 「일정 연결」 한 비용 → 숙소 결제(#271).
--
-- 가계부에서 숙소 카드(schedule_items.stay_id 가 있는 카드)를 고르면 비용이 카드(schedule_item_id)에 붙어
-- 숙소 상세의 「결제」 가 비어 보였다. 숙소 결제는 expenses.stay_id 가 붙은 비용 하나다(0051).
--   * 카드를 고른 숙소 비용(카테고리 숙소)은, 그 숙소에 결제가 아직 없으면 숙소 결제로 저장한다.
--     이름 · 카테고리 · 일정 연결은 뒤이어 도는 expenses_stay_fields 가 숙소에 맞춘다(트리거는 이름 순으로 돈다 — card_link < fields).
--   * 카테고리를 바꾼 비용(조식 = 식비 등)과 결제가 이미 있는 숙소의 비용은 카드에 연결된 채 둔다(숙소 상세 「연결된 비용」).
--   * 이미 카드에 붙어 있던 비용은 숙소마다 가장 먼저 만든 한 건을 결제로 옮긴다 — 항공편(0055)과 같다(2026-10-31 사용자 결정).

create function public.link_stay_card_expense()
returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  v_stay uuid;
begin
  if new.schedule_item_id is null or new.stay_id is not null or new.flight_id is not null
     or new.category is distinct from 'lodging' then
    return new;
  end if;
  select s.stay_id into v_stay from public.schedule_items s
  where s.id = new.schedule_item_id and s.trip_id = new.trip_id;
  if v_stay is null then
    return new;
  end if;
  if not exists (select 1 from public.expenses e where e.stay_id = v_stay and e.id <> new.id) then
    new.stay_id := v_stay;
  end if;
  return new;
end $$;

-- 일정 연결을 바꿀 때만 — 금액만 고치는 저장으로 카드 연결 비용이 결제로 바뀌지 않게
create trigger expenses_stay_card_link before insert or update of schedule_item_id, category on public.expenses
  for each row execute function public.link_stay_card_expense();

-- ---------- 이미 숙소 카드에 연결된 비용 → 숙소 결제 ----------
update public.expenses e
set stay_id = pick.stay_id
from (
  select distinct on (s.stay_id) s.stay_id, x.id
  from public.expenses x
  join public.schedule_items s on s.id = x.schedule_item_id
  where s.stay_id is not null and x.flight_id is null and x.stay_id is null and x.category = 'lodging'
    and not exists (select 1 from public.expenses p where p.stay_id = s.stay_id)
  order by s.stay_id, x.created_at, x.id
) pick
where e.id = pick.id;
