import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  expenseHome,
  type ExpenseWithSplits,
  type PersonKey,
  type Transfer,
} from "@/entities/expense";
import { type ExchangeRates, MissingRateError } from "@/shared/lib/money";

/** 카테고리 한 줄 — 기준 화폐 합계와 전체 중 비율(0~100, 반올림) */
export type CategoryShare = { category: ExpenseCategory; total: number; percent: number };

/**
 * 카테고리별 합계 — 합계에 넣는 지출만, 큰 것부터. 0 인 카테고리는 뺀다.
 * 환율을 모르는 지출은 빼고 센다(총 지출 합계와 같은 규칙). 같은 금액은 카테고리 순서대로
 */
export function categoryShares(
  expenses: ExpenseWithSplits[],
  home: string,
  rates: ExchangeRates,
): CategoryShare[] {
  const sums = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    if (!e.counted) continue;
    const value = homeOrNull(e, home, rates);
    if (value === null) continue;
    const category = (
      EXPENSE_CATEGORIES.includes(e.category as ExpenseCategory) ? e.category : "other"
    ) as ExpenseCategory;
    sums.set(category, (sums.get(category) ?? 0) + value);
  }
  const all = [...sums.values()].reduce((n, v) => n + v, 0);
  return EXPENSE_CATEGORIES.filter((c) => (sums.get(c) ?? 0) > 0)
    .map((category) => {
      const total = sums.get(category) ?? 0;
      return { category, total, percent: Math.round((total / all) * 100) };
    })
    .sort((a, b) => b.total - a.total);
}

/** 기준 화폐 금액. 환율을 모르면 null */
function homeOrNull(e: ExpenseWithSplits, home: string, rates: ExchangeRates): number | null {
  try {
    return expenseHome(e, home, rates);
  } catch (err) {
    if (err instanceof MissingRateError) return null;
    throw err;
  }
}

/** 대시보드 카테고리 카드 — 위 3개와 「그 외 N개」(카테고리 목록 · 합계). 그 외가 없으면 null */
export function topCategories(shares: CategoryShare[], count = 3) {
  const rest = shares.slice(count);
  return {
    top: shares.slice(0, count),
    rest: rest.length
      ? { categories: rest.map((s) => s.category), total: rest.reduce((n, s) => n + s.total, 0) }
      : null,
  };
}

/** 보냈다고 적은 송금 — 송금 기록 id 와 함께 */
export type SentTransfer = Transfer & { id: string };

/** 송금 한 줄 — 남은 송금이거나, 이미 보냈다고 적은 송금(done). key 는 목록에서 줄을 가린다 */
export type TransferRow = Transfer & { done: boolean; key: string };

/**
 * 송금 목록 — 남은 송금 다음에 이미 보낸 송금. `mineFirst` 면 나와 주고받는 줄을 각 무리의 앞으로(PC).
 * 남은 송금은 보낸 돈을 뺀 차액으로 다시 계산한 것이라, 보낸 송금과 같은 쌍이 함께 보일 수 있다(일부만 보냈을 때)
 */
export function transferRows(
  remaining: Transfer[],
  sent: SentTransfer[],
  me: PersonKey | null,
  mineFirst = false,
): TransferRow[] {
  const mine = (t: Transfer) => me !== null && (t.from === me || t.to === me);
  /** 나와 주고받는 줄을 앞으로(안정 정렬) */
  const order = <T extends Transfer>(list: T[]) =>
    mineFirst ? [...list].sort((a, b) => Number(mine(b)) - Number(mine(a))) : list;
  return [
    // 남은 송금은 한 쌍이 한 번만 나온다(minimizeTransfers). 보낸 기록은 같은 쌍이 여러 번일 수 있어 id 로 가린다
    ...order(remaining).map((t) => ({ ...t, done: false, key: `${t.from}>${t.to}` })),
    ...order(sent).map(({ id, ...t }) => ({ ...t, done: true, key: id })),
  ];
}

/** 둘 이상이 나눠 낸(정산이 생기는) 지출이 하나라도 있는가 — 없으면 정산 띠가 「나눠 낸 비용이 생기면…」 */
export function hasSharedExpense(expenses: ExpenseWithSplits[]): boolean {
  return expenses.some((e) => e.counted && !e.split_each && e.splits.length > 1);
}
