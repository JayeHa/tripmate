import { decimalsOf, type ExchangeRates, MissingRateError, roundTo } from "@/shared/lib/money";

import type { Expense } from "../model/types";
import { expenseHome } from "./amounts";

type Summed = Pick<Expense, "amount" | "currency" | "rate" | "counted">;

export type ExpenseTotals = {
  /** 기준 화폐 합계. 환율을 모르는 지출은 빠져 있다 */
  home: number;
  /** 쓴 통화별 합계(원래 금액) */
  byCurrency: Record<string, number>;
  /** 환율이 없어 home 에 못 넣은 통화 */
  missing: string[];
};

/**
 * 지출 합계 — 합계에 넣는 지출(counted)만 더한다. 결제 예정도 들어간다.
 * 환율을 모르는 통화는 통화별 합계에만 넣고 missing 으로 알린다(전체를 던지지 않는다 — 목록은 보여야 한다)
 */
export function sumExpenses(expenses: Summed[], home: string, rates: ExchangeRates): ExpenseTotals {
  const byCurrency: Record<string, number> = {};
  const missing = new Set<string>();
  let total = 0;
  for (const e of expenses) {
    if (!e.counted) continue;
    byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + Number(e.amount);
    try {
      total += expenseHome(e, home, rates);
    } catch (err) {
      if (!(err instanceof MissingRateError)) throw err;
      missing.add(e.currency);
    }
  }
  return { home: roundTo(total, decimalsOf(home)), byCurrency, missing: [...missing] };
}
