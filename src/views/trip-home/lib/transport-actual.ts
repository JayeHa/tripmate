import type { ExpenseWithSplits } from "@/entities/expense";
import type { FareTotal } from "@/entities/transport-fare";
import { dayIndexToDate } from "@/shared/lib/days";

/** 가계부 교통 비용의 내 몫 — 통화마다, 처음 나온 순서대로 */
export type ActualFares = {
  /** 날짜(day index)별. 그날 내 몫이 없으면 키가 없다 */
  byDay: Map<number, FareTotal[]>;
  /** 날짜 없는 비용(여행준비) · 기간 밖 날짜 */
  undated: FareTotal[];
  /** 전부 */
  total: FareTotal[];
};

/** 통화 합계에 더한다 — 그 통화가 없으면 뒤에 붙인다 */
function addTo(list: FareTotal[], currency: string, amount: number) {
  const row = list.find((t) => t.currency === currency);
  if (row) row.amount += amount;
  else list.push({ currency, amount });
}

/**
 * 가계부의 교통 비용 중 내 몫 — 합계에 넣는 비용(counted)만, 나눠 낸 몫(splits)에서 내 줄의 금액을 그 비용의 통화로.
 * 함께하지 않은 비용은 0 이라 빠진다. 날짜는 쓴 날(spent_on)로 여행의 몇째 날인지 찾고,
 * 비었거나(여행준비) 기간 밖이면 날짜 없음에 넣는다
 */
export function actualFares(
  expenses: ExpenseWithSplits[],
  userId: string,
  startDate: string,
  totalDays: number,
): ActualFares {
  const dayOf = new Map(
    Array.from({ length: totalDays }, (_, i) => [dayIndexToDate(startDate, i), i] as const),
  );
  const byDay = new Map<number, FareTotal[]>();
  const undated: FareTotal[] = [];
  const total: FareTotal[] = [];
  for (const e of expenses) {
    if (!e.counted || e.category !== "transport") continue;
    const share = e.splits
      .filter((s) => s.user_id === userId)
      .reduce((sum, s) => sum + Number(s.share), 0);
    if (share === 0) continue;
    const day = e.spent_on === null ? undefined : dayOf.get(e.spent_on);
    const list = day === undefined ? undated : (byDay.get(day) ?? []);
    addTo(list, e.currency, share);
    if (day !== undefined) byDay.set(day, list);
    addTo(total, e.currency, share);
  }
  return { byDay, undated, total };
}
