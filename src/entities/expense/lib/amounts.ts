import { type ExchangeRates, toHome } from "@/shared/lib/money";

import type { Expense } from "../model/types";

type Priced = Pick<Expense, "currency" | "rate">;

/**
 * 이 지출의 통화로 적은 값(금액 · 한 사람 몫)을 기준 화폐로. 지출에 적은 환율이 먼저고, 없으면 여행 기본 환율.
 * 기본 환율은 `toHome` 처럼 곱한 뒤 나눈다 — 100엔 = 850.1원에서 3,500 × (850.1 / 100) 은 29,753.4999… 라
 * 반올림이 1원 틀어진다. 반올림하지 않는다(더한 뒤 한 번만 반올림). 둘 다 없으면 MissingRateError
 */
export function toHomeFor(e: Priced, value: number, home: string, rates: ExchangeRates): number {
  if (e.currency === home) return value;
  return e.rate === null ? toHome(value, e.currency, home, rates) : value * Number(e.rate);
}

/** 지출 금액을 기준 화폐로 */
export function expenseHome(
  e: Priced & Pick<Expense, "amount">,
  home: string,
  rates: ExchangeRates,
): number {
  return toHomeFor(e, Number(e.amount), home, rates);
}
