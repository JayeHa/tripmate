import {
  expenseHome,
  type ExpensePeriod,
  type ExpenseWithSplits,
  sumExpenses,
} from "@/entities/expense";
import { type ExchangeRates, MissingRateError } from "@/shared/lib/money";

import { periodLabel, periodParam } from "./period";

/** PC 표 정렬 — 최신순(날짜 묶음) · 금액 높은순 · 금액 낮은순(한 목록) */
export type ExpenseSort = "date" | "high" | "low";

export const SORT_LABEL: Record<ExpenseSort, string> = {
  date: "최신순",
  high: "금액 높은순",
  low: "금액 낮은순",
};

type Section<R> = {
  period: ExpensePeriod;
  expenses: ExpenseWithSplits[];
  rows: R[];
  total: { home: number };
};

type GroupTrip = { start_date: string; home_currency: string; exchange_rates: ExchangeRates };

/** 표의 묶음 하나 — 머리 글 · 합계(비용이 없으면 null), 줄마다 앞에 붙일 날 태그(날짜 묶음이면 null) */
export type TableGroup<R> = {
  key: string;
  title: string;
  total: number | null;
  rows: { row: R; tag: string | null }[];
};

/** 날짜 묶음의 머리 — 「여행 준비」 · 「day 2 · 10.31 (토)」 */
function sectionTitle(period: ExpensePeriod, startDate: string): string {
  if (period === "prep") return "여행 준비";
  const { label, date } = periodLabel(period, startDate);
  return `${label} · ${date.replace("/", " (")})`;
}

/** 금액순 정렬 값 — 기준 화폐 환산. 환율을 모르면 null(어느 순서든 맨 뒤) */
function homeOrNull(e: ExpenseWithSplits, trip: GroupTrip): number | null {
  try {
    return expenseHome(e, trip.home_currency, trip.exchange_rates);
  } catch (err) {
    if (err instanceof MissingRateError) return null;
    throw err;
  }
}

/**
 * PC 표의 묶음. 최신순이면 날짜 묶음 그대로(비용 없는 날도). 금액순이면 날짜 묶음을 풀어 한 묶음 「금액 높은순 · N건」 으로,
 * 기준 화폐로 환산한 금액 순서(같으면 날짜 순서)에 줄마다 「day 2」 · 「준비」 태그를 붙인다
 */
export function tableGroups<R>(
  sections: Section<R>[],
  sort: ExpenseSort,
  trip: GroupTrip,
): TableGroup<R>[] {
  if (sort === "date") {
    return sections.map((s) => ({
      key: periodParam(s.period),
      title: sectionTitle(s.period, trip.start_date),
      total: s.rows.length > 0 ? s.total.home : null,
      rows: s.rows.map((row) => ({ row, tag: null })),
    }));
  }
  const flat = sections.flatMap((s) =>
    s.expenses.map((e, i) => ({
      e,
      row: s.rows[i],
      tag: s.period === "prep" ? "준비" : periodLabel(s.period, trip.start_date).label,
      home: homeOrNull(e, trip),
    })),
  );
  const sign = sort === "high" ? -1 : 1;
  // Array.prototype.sort 는 안정 정렬이라 같은 금액은 날짜 순서 그대로
  flat.sort((a, b) => {
    if (a.home === null || b.home === null)
      return Number(a.home === null) - Number(b.home === null);
    return sign * (a.home - b.home);
  });
  const total = sumExpenses(
    flat.map((x) => x.e),
    trip.home_currency,
    trip.exchange_rates,
  ).home;
  return [
    {
      key: "sorted",
      title: `${SORT_LABEL[sort]} · ${flat.length}건`,
      total: flat.length > 0 ? total : null,
      rows: flat.map(({ row, tag }) => ({ row, tag })),
    },
  ];
}
