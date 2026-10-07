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

/** 날짜별 막대 한 칸 — 「준비」 · 「D1」, 높이(px). 지출이 없는 날은 0(막대 없이 자리 · 이름만) */
export type DayBar = { key: string; label: string; height: number };

/** 막대의 가장 큰 높이(px). 지출이 있는 날은 가장 작아도 4 는 보인다 */
const BAR_MAX = 60;
const BAR_MIN = 4;

/**
 * 날짜별 막대 — 그 카테고리 지출이 서로 다른 날 2일 이상에 걸쳐 있을 때만(한 번 결제한 숙소 · 항공은 막대가 뜻이 없다). 아니면 null.
 * 여행 날짜(day 1 ~ N)는 지출이 없어도 칸을 두어 날짜 간격이 보이게 하고, 「여행준비」 는 여행 날짜가 아니라 지출이 있을 때만 맨 앞에 둔다.
 * `days` 는 여행준비 · day 1 … N 순서(지출 없는 날 포함)
 */
export function dayBars(days: { period: ExpensePeriod; total: number }[]): DayBar[] | null {
  const spent = days.filter((d) => d.total > 0);
  if (spent.length < 2) return null;
  const max = Math.max(...spent.map((d) => d.total));
  return days
    .filter((d) => d.period !== "prep" || d.total > 0)
    .map((d) => ({
      key: String(d.period),
      label: d.period === "prep" ? "준비" : `D${d.period + 1}`,
      height: d.total > 0 ? Math.max(BAR_MIN, Math.round((d.total / max) * BAR_MAX)) : 0,
    }));
}
