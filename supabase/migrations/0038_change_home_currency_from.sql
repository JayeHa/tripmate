-- 기준 화폐 바꾸기에 「화면이 알던 옛 기준」 을 받는다(0037 고침).
--
-- factor 와 새 여행 환율은 화면이 자기가 아는 기준 화폐(캐시일 수 있다)로 계산한다. 그사이 다른 멤버가 기준 화폐를
-- 바꿨으면 이미 새 기준으로 바뀐 지출별 환율 · 송금 기록을 다른 기준의 factor 로 한 번 더 나누게 된다(되돌릴 수 없다).
-- 그래서 p_from 이 지금 기준 화폐와 다르면 거부한다 — 화면은 「다른 사람이 기준 화폐를 바꿨어요」 로 안내한다.
-- 그 밖은 0037 과 같다.
drop function public.change_home_currency(uuid, text, jsonb, numeric);

create or replace function public.change_home_currency(
  p_trip_id uuid,
  p_from text,
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

  -- 지금 기준 화폐. 행을 잠가 읽는다 — 두 사람이 동시에 바꾸면 뒤 사람은 앞 사람이 바꾼 기준을 읽고 아래에서 거부된다.
  -- RLS 로 안 보이면 null
  select home_currency into v_old from public.trips where id = p_trip_id for update;
  if v_old is null then
    raise exception 'trip not found or not a member';
  end if;
  if v_old <> p_from then
    raise exception 'home currency changed by someone else';
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
