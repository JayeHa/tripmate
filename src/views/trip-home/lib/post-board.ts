import {
  computeNetBalances,
  type ExpenseWithSplits,
  minimizeTransfers,
  type PersonKey,
  type PersonRef,
  type SettleBandState,
  settleBandState,
  type Settlement,
  sumExpenses,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import { decimalsOf, type ExchangeRates, formatMoney, MissingRateError } from "@/shared/lib/money";

/** 여행 요약 카드의 칸 넷 — 「총 지출」 · 「1인당」 · 「다녀온 곳」 · 「바우처」 */
export type SummaryStat = { label: string; value: string };

/**
 * 여행 요약 — 합계(합계에 넣는 비용, 환율 모르는 것은 빠짐) · 사람 수로 나눈 1인당 ·
 * 일정에 담은 장소 수(같은 장소는 한 번 — 숙소처럼 여러 날 붙어도) · 바우처 장 수
 */
export function tripSummary(
  data: { expenses: ExpenseWithSplits[]; items: ScheduleItem[]; voucherCount: number },
  ctx: { home: string; rates: ExchangeRates; peopleCount: number },
): SummaryStat[] {
  const total = sumExpenses(data.expenses, ctx.home, ctx.rates).home;
  const places = new Set(
    data.items.filter((i) => i.kind === "place" && i.place_id).map((i) => i.place_id),
  );
  return [
    { label: "총 지출", value: formatMoney(total, ctx.home) },
    { label: "1인당", value: formatMoney(total / Math.max(ctx.peopleCount, 1), ctx.home) },
    { label: "다녀온 곳", value: `${places.size}곳` },
    { label: "바우처", value: `${data.voucherCount}장` },
  ];
}

/**
 * 여행 후 정산 띠 — 내가 받을 돈 · 보낼 돈이 있거나 일행끼리 남은 송금이 있을 때만. 정산이 다 끝났으면(나눠 낸 비용이 없을 때 포함) null.
 * 이미 보낸 송금(settlements)을 빼고 계산한다. 환율을 모르는 비용이 있으면 틀린 금액을 보이지 않게 null
 */
export function postSettleBand(
  expenses: ExpenseWithSplits[],
  settlements: Settlement[],
  ctx: { home: string; rates: ExchangeRates; people: PersonRef[]; me: PersonKey },
): SettleBandState | null {
  try {
    const { net } = computeNetBalances(expenses, ctx.people, ctx.home, ctx.rates, settlements);
    const band = settleBandState(minimizeTransfers(net, decimalsOf(ctx.home)), ctx.me, true);
    return band.kind === "done" && band.pending === 0 ? null : band;
  } catch (e) {
    if (e instanceof MissingRateError) return null;
    throw e;
  }
}
