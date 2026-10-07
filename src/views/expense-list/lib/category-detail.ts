import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  type ExpensePeriod,
} from "@/entities/expense";

/** 카테고리 상세에서 고른 것 — 카테고리 하나 또는 전체 */
export type CategoryPick = ExpenseCategory | "all";

/** 주소의 c 값 — 모르는 값 · 없으면 전체 */
export function parseCategoryPick(value: string | null | undefined): CategoryPick {
  return EXPENSE_CATEGORIES.find((c) => c === value) ?? "all";
}

/** 「숙소 · 3건 · 전체의 32%」, 전체면 「전체 · 5건」 */
export function categoryTitle(pick: CategoryPick, count: number, percent: number): string {
  if (pick === "all") return `전체 · ${count}건`;
  return `${EXPENSE_CATEGORY_LABEL[pick]} · ${count}건 · 전체의 ${percent}%`;
}

/** 날짜별 막대 한 칸 — 「준비」 · 「D1」, 높이(px) */
export type DayBar = { key: string; label: string; height: number };

/** 막대의 가장 큰 높이(px). 가장 작은 막대도 4 는 보인다 */
const BAR_MAX = 60;
const BAR_MIN = 4;

/**
 * 날짜별 막대 — 그 카테고리 지출이 서로 다른 날 2일 이상에 걸쳐 있을 때만(한 번 결제한 숙소 · 항공은 막대가 뜻이 없다).
 * 지출이 없는 날은 뺀다. 아니면 null
 */
export function dayBars(days: { period: ExpensePeriod; total: number }[]): DayBar[] | null {
  const spent = days.filter((d) => d.total > 0);
  if (spent.length < 2) return null;
  const max = Math.max(...spent.map((d) => d.total));
  return spent.map((d) => ({
    key: String(d.period),
    label: d.period === "prep" ? "준비" : `D${d.period + 1}`,
    height: Math.max(BAR_MIN, Math.round((d.total / max) * BAR_MAX)),
  }));
}
