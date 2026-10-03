import type { ExpenseWithSplits } from "@/lib/entities/expense";
import { decimalsOf, roundTo, toHome } from "@/lib/money";
import type { ExchangeRates } from "@/lib/money";

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
    const amount = Number(e.amount);
    ensure(e.payer_id);
    const homeAmount = toHome(amount, e.currency, home, rates);
    paid[e.payer_id] += homeAmount;
    paidByCurrency[e.payer_id][e.currency] = (paidByCurrency[e.payer_id][e.currency] ?? 0) + amount;
    totalByCurrency[e.currency] = (totalByCurrency[e.currency] ?? 0) + amount;
    totalHome += homeAmount;

    for (const s of e.splits) {
      ensure(s.user_id);
      owed[s.user_id] += toHome(Number(s.share), e.currency, home, rates);
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
