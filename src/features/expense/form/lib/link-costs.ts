import { expenseHome, type ExpenseWithSplits } from "@/entities/expense";
import { type ExchangeRates, MissingRateError } from "@/shared/lib/money";

/**
 * 일정마다 이미 연결된 비용의 합(기준 화폐) — 일정 고르기에서 「이 일정에 벌써 쓴 돈」 을 보인다.
 * 지금 고치는 비용(exceptId)은 뺀다. 환율이 없는 비용은 더하지 않는다(합계가 틀리느니 작게)
 */
export function linkCosts(
  expenses: ExpenseWithSplits[],
  home: string,
  rates: ExchangeRates,
  exceptId?: string,
): Map<string, number> {
  const costs = new Map<string, number>();
  for (const e of expenses) {
    if (!e.schedule_item_id || e.id === exceptId) continue;
    const value = homeOrNull(e, home, rates);
    if (value === null) continue;
    costs.set(e.schedule_item_id, (costs.get(e.schedule_item_id) ?? 0) + value);
  }
  return costs;
}

/** 기준 화폐 금액, 환율이 없으면 null */
function homeOrNull(e: ExpenseWithSplits, home: string, rates: ExchangeRates) {
  try {
    return expenseHome(e, home, rates);
  } catch (error) {
    if (error instanceof MissingRateError) return null;
    throw error;
  }
}
