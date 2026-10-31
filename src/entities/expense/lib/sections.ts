import { byCreatedAt } from "@/shared/lib/created-at";
import { dateToDayIndex, dayCount } from "@/shared/lib/days";
import type { ExchangeRates } from "@/shared/lib/money";

import type { ExpenseWithSplits } from "../model/types";
import { type ExpenseTotals, sumExpenses } from "./totals";

/** 지출이 속한 때 — 여행준비(날짜 없음) 또는 여행 몇째 날(0-base) */
export type ExpensePeriod = "prep" | number;

export type ExpenseSection = {
  period: ExpensePeriod;
  /** 시각순, 시각이 없는 지출은 그 뒤에 만든 순서대로(byDayOrder) */
  expenses: ExpenseWithSplits[];
  total: ExpenseTotals;
};

type SectionTrip = {
  start_date: string;
  end_date: string;
  home_currency: string;
  exchange_rates: ExchangeRates;
};

/** 지출이 속한 때. 기간 밖 날짜는 첫날 · 마지막 날로 붙인다(여행 날짜를 바꾸면 함께 옮겨져 보통은 없다) */
export function periodOf(e: Pick<ExpenseWithSplits, "spent_on">, trip: SectionTrip): ExpensePeriod {
  return e.spent_on === null ? "prep" : dateToDayIndex(trip.start_date, trip.end_date, e.spent_on);
}

/**
 * 같은 묶음 안의 순서 — 시각(`spent_time`)이 있으면 시각순, 없는 지출은 맨 뒤에 만든 순서대로(#288).
 * 시각은 「HH:MM:SS」 · 「HH:MM」(화면에 먼저 보인 지출) 둘 다 와서 앞 5자만 비교한다
 */
export function byDayOrder(
  a: Pick<ExpenseWithSplits, "spent_time" | "created_at">,
  b: Pick<ExpenseWithSplits, "spent_time" | "created_at">,
): number {
  const ta = a.spent_time?.slice(0, 5) ?? null;
  const tb = b.spent_time?.slice(0, 5) ?? null;
  if (ta !== tb) {
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta < tb ? -1 : 1;
  }
  return byCreatedAt(a, b);
}

/**
 * 가계부 목록의 묶음 — 여행준비, day 1 … day N 순서. 지출이 없는 날도 묶음은 있다(「비용 추가」 자리).
 * filter 를 주면 그 묶음 하나만. 묶음마다 합계(합계에서 뺀 지출은 빠진다)
 */
export function expenseSections(
  expenses: ExpenseWithSplits[],
  trip: SectionTrip,
  filter: ExpensePeriod | "all" = "all",
): ExpenseSection[] {
  const periods: ExpensePeriod[] = [
    "prep",
    ...Array.from({ length: dayCount(trip.start_date, trip.end_date) }, (_, i) => i),
  ];
  const byPeriod = new Map<ExpensePeriod, ExpenseWithSplits[]>(periods.map((p) => [p, []]));
  const ordered = [...expenses].sort(byDayOrder);
  for (const e of ordered) byPeriod.get(periodOf(e, trip))?.push(e);
  return periods
    .filter((p) => filter === "all" || p === filter)
    .map((period) => {
      const list = byPeriod.get(period) ?? [];
      return {
        period,
        expenses: list,
        total: sumExpenses(list, trip.home_currency, trip.exchange_rates),
      };
    });
}
