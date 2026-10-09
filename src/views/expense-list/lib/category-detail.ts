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

/** 누적 막대 한 칸 — 카테고리와 높이(px) */
export type BarSegment = { category: ExpenseCategory; height: number };

/**
 * 누적 막대의 쌓는 순서(아래 → 위) — 위에서 읽으면 무지개(쇼핑 빨강 · 식비 주황 · 숙소 초록 · 항공 파랑 · 관광 보라), 회색인 교통 · 기타는 맨 아래
 */
const STACK_ORDER: ExpenseCategory[] = [
  "other",
  "transport",
  "activity",
  "flight",
  "lodging",
  "food",
  "shopping",
];

/** 누적 막대 칸의 가장 작은 높이(px) — 아주 적게 쓴 카테고리도 색이 보이게 */
const SEGMENT_MIN = 2;

/**
 * 「전체」 의 하루 막대를 그날 카테고리 금액 비율로 나눈 칸들 — 아래 → 위 순서(STACK_ORDER, 위에서 무지개 순)로 고정해
 * 날마다 같은 색이 같은 자리에 온다. 칸은 최소 2px, 반올림으로 생긴 차이는 가장 큰 칸에서 맞춘다(작은 칸이 많으면 막대가 조금 높아질 수 있다)
 */
export function stackSegments(
  parts: { category: ExpenseCategory; total: number }[],
  height: number,
): BarSegment[] {
  const order = STACK_ORDER.flatMap((c) => parts.filter((p) => p.category === c && p.total > 0));
  const sum = order.reduce((n, p) => n + p.total, 0);
  if (sum <= 0 || height <= 0) return [];
  const segments = order.map((p) => ({
    category: p.category,
    height: Math.max(SEGMENT_MIN, Math.round((p.total / sum) * height)),
  }));
  const largest = segments.reduce((a, b) => (b.height > a.height ? b : a));
  const diff = height - segments.reduce((n, s) => n + s.height, 0);
  largest.height = Math.max(SEGMENT_MIN, largest.height + diff);
  return segments;
}
