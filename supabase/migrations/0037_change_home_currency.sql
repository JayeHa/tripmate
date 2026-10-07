-- 기준 화폐를 바꾼다 — 여행 환율 · 지출별 환율 · 송금 기록 금액을 새 기준으로 함께 다시 계산한다(한 트랜잭션).
--
-- 기준 화폐만 바꾸면 옛 기준으로 적은 값이 그대로 남는다: 여행 환율은 「통화 단위 = 옛 기준 얼마」,
-- 지출별 환율(expenses.rate)은 「옛 기준 / 통화 1단위」, 송금 기록(settlements.amount)은 옛 기준 금액이다.
-- 그래서 옛 기준으로 쓴 지출이 「환율이 없어 합계에서 빠졌어요」 가 된다(2026-10-07).
--
-- p_factor = 새 기준 1단위가 옛 기준으로 얼마인가(100엔 = 855원 → 8.55). 화면이 옛 여행 환율에서 구하거나,
-- 옛 환율에 새 기준이 없으면 사용자에게 물어 넘긴다. 옛 기준 → 새 기준 금액은 「÷ p_factor」 다.
-- p_rates = 새 기준으로 다시 계산한 여행 환율(화면이 같은 계산으로 미리 보여 준 값, 사용자가 고쳤을 수 있다).
-- 옛 기준 화폐 줄이 꼭 있어야 한다 — 옛 기준으로 쓴 지출(지출별 환율이 없다)이 그 환율로 계산된다.
--
-- 지출 금액(amount) · 사람별 몫(expense_splits.share)은 쓴 통화 그대로라 바꾸지 않는다.
-- security invoker — 여행 · 지출 · 송금 기록을 고칠 수 있는 사람(멤버, RLS)만 된다. update_trip_dates 와 같은 방식.
create or replace function public.change_home_currency(
  p_trip_id uuid,
  p_currency text,
  p_rates jsonb,
  p_factor numeric
)
returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_old text;
begin
  if p_factor is null or p_factor <= 0 then
    raise exception 'factor must be positive';
  end if;

  -- 옛 기준 화폐. 행을 잠가 읽는다 — 두 사람이 동시에 바꾸면 뒤 사람은 앞 사람이 바꾼 기준을 읽고,
  -- 같은 값을 두 번 나누지 않게 아래 「같은 화폐」 검사에 걸린다. RLS 로 안 보이면 null
  select home_currency into v_old from public.trips where id = p_trip_id for update;
  if v_old is null then
    raise exception 'trip not found or not a member';
  end if;
  if v_old = p_currency then
    raise exception 'currency is already the home currency';
  end if;
  if p_rates ? p_currency then
    raise exception 'rates must not include the new home currency';
  end if;
  if not p_rates ? v_old then
    raise exception 'rates must include the old home currency';
  end if;

  update public.trips
  set home_currency = p_currency, exchange_rates = p_rates
  where id = p_trip_id;
  if not found then
    raise exception 'trip not found or not a member';
  end if;

  -- 새 기준 화폐로 쓴 지출은 이제 환율이 필요 없다
  update public.expenses set rate = null
  where trip_id = p_trip_id and currency = p_currency and rate is not null;

  -- 다른 외화의 지출별 환율: 옛 기준 / 1단위 → 새 기준 / 1단위. 저장 칸(소수 8자리)에서 0 이 되지 않게
  update public.expenses
  set rate = greatest(round(rate / p_factor, 8), 0.00000001)
  where trip_id = p_trip_id and currency <> p_currency and rate is not null;

  -- 송금 기록: 옛 기준 금액 → 새 기준 금액. 저장 칸(소수 2자리)에서 0 이 되지 않게(amount > 0)
  update public.settlements
  set amount = greatest(round(amount / p_factor, 2), 0.01)
  where trip_id = p_trip_id;
end $$;
