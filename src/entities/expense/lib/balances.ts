import { decimalsOf, type ExchangeRates, roundTo } from "@/shared/lib/money";

import type { ExpenseWithSplits } from "../model/types";
import { expenseRate } from "./amounts";

export type Balances = {
  /** 홈 화폐 기준 낸 금액 */
  paid: Record<string, number>;
  /** 홈 화폐 기준 내 몫 */
  owed: Record<string, number>;
  /** paid - owed. 양수면 받아야 함, 음수면 내야 함. 합은 정확히 0 */
  net: Record<string, number>;
  /** 원본 화폐별 낸 금액 (UI 표시용) */
  paidByCurrency: Record<string, Record<string, number>>;
  /** 화폐별 총 지출 */
  totalByCurrency: Record<string, number>;
  /** 홈 화폐 총 지출 */
  totalHome: number;
};

/**
 * 멤버별 낸 돈 · 내 몫 · 차액. 합계에서 뺀 지출(counted = false)은 쓰지 않은 돈이라 정산에도 넣지 않는다.
 * 환율은 지출에 적은 것이 먼저고, 없으면 여행 기본 환율이다. 그것도 없으면 MissingRateError
 */
export function computeNetBalances(
  expenses: ExpenseWithSplits[],
  memberIds: string[],
  home: string,
  rates: ExchangeRates,
): Balances {
  const ids = new Set(memberIds);
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  const paidByCurrency: Record<string, Record<string, number>> = {};
  const totalByCurrency: Record<string, number> = {};
  let totalHome = 0;

  const ensure = (id: string) => {
    ids.add(id);
    paid[id] ??= 0;
    owed[id] ??= 0;
    paidByCurrency[id] ??= {};
  };
  memberIds.forEach(ensure);

  for (const e of expenses) {
    if (!e.counted) continue;
    const amount = Number(e.amount);
    ensure(e.payer_id);
    const rate = expenseRate(e, home, rates);
    const homeAmount = amount * rate;
    paid[e.payer_id] += homeAmount;
    paidByCurrency[e.payer_id][e.currency] = (paidByCurrency[e.payer_id][e.currency] ?? 0) + amount;
    totalByCurrency[e.currency] = (totalByCurrency[e.currency] ?? 0) + amount;
    totalHome += homeAmount;

    for (const s of e.splits) {
      ensure(s.user_id);
      owed[s.user_id] += Number(s.share) * rate;
    }
  }

  const d = decimalsOf(home);
  const net: Record<string, number> = {};
  for (const id of ids) net[id] = roundTo(paid[id] - owed[id], d);

  // 반올림 드리프트 보정: |net| 이 가장 큰 사람에게 몰아서 합계를 정확히 0으로
  const drift = roundTo(
    Object.values(net).reduce((a, b) => a + b, 0),
    d,
  );
  if (drift !== 0) {
    const target = Object.entries(net).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0];
    if (target) net[target] = roundTo(net[target] - drift, d);
  }

  return { paid, owed, net, paidByCurrency, totalByCurrency, totalHome: roundTo(totalHome, d) };
}
