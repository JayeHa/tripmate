import { roundTo } from "./currency";
import type { ExchangeRates } from "./types";

/**
 * 새 기준 화폐 1단위가 옛 기준으로 얼마인가(100엔 = 855원이면 8.55) — 옛 기준 금액 ÷ 이 값 = 새 기준 금액.
 * 옛 여행 환율에 새 기준 화폐가 없으면 null(사용자에게 물어야 한다)
 */
export function rebaseFactor(rates: ExchangeRates, newHome: string): number | null {
  const r = rates[newHome];
  return r ? r.value / r.unit : null;
}

/** 환율 값 자릿수 — 1 이상은 소수 둘째, 그보다 작으면 여섯째까지 */
function rateValue(value: number): number {
  return roundTo(value, value >= 1 ? 2 : 6);
}

/**
 * 옛 기준의 여행 환율을 새 기준으로 다시 계산한다. 단위는 그대로 두고 값만 ÷ factor,
 * 새 기준 화폐 줄은 빼고 옛 기준 화폐 줄을 더한다 — 옛 기준으로 쓴 지출이 이 환율로 계산된다.
 * 옛 기준 1단위가 새 기준 1 보다 작으면(원 → 엔) 100 단위로 적는다(100원 = 11.7엔)
 */
export function rebaseRates(
  rates: ExchangeRates,
  oldHome: string,
  newHome: string,
  factor: number,
): ExchangeRates {
  const next: ExchangeRates = {};
  for (const [code, r] of Object.entries(rates)) {
    if (code === newHome || code === oldHome) continue;
    next[code] = { unit: r.unit, value: rateValue(r.value / factor) };
  }
  const unit = 1 / factor < 1 ? 100 : 1;
  next[oldHome] = { unit, value: rateValue(unit / factor) };
  return next;
}
