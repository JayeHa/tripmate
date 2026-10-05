import { type ExchangeRates, ratePerUnit } from "@/shared/lib/money";

import type { Expense } from "../model/types";

type Priced = Pick<Expense, "currency" | "rate">;

/**
 * 이 지출에 쓰는 환율 — 통화 1단위가 기준 화폐로 얼마인지. 지출에 적은 환율이 먼저고, 없으면 여행 기본 환율.
 * 기준 화폐로 쓴 지출은 1. 둘 다 없으면 MissingRateError
 */
export function expenseRate(e: Priced, home: string, rates: ExchangeRates): number {
  if (e.currency === home) return 1;
  return e.rate === null ? ratePerUnit(e.currency, home, rates) : Number(e.rate);
}

/** 지출 금액을 기준 화폐로. 반올림하지 않는다(더한 뒤 한 번만 반올림) */
export function expenseHome(
  e: Priced & Pick<Expense, "amount">,
  home: string,
  rates: ExchangeRates,
): number {
  return Number(e.amount) * expenseRate(e, home, rates);
}
