import { roundTo } from "@/shared/lib/money";

export type Transfer = { from: string; to: string; amount: number };

/**
 * 그리디 부채 단순화. net > 0 은 받을 사람, net < 0 은 낼 사람.
 * 결과는 최대 n-1 건이며 동일 입력에 대해 결정적.
 */
export function minimizeTransfers(net: Record<string, number>, decimals: number): Transfer[] {
  const eps = 0.5 / 10 ** decimals;
  const creditors = Object.entries(net)
    .filter(([, v]) => v > eps)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -eps)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const t = roundTo(Math.min(c.amount, d.amount), decimals);
    if (t > 0) transfers.push({ from: d.id, to: c.id, amount: t });
    c.amount = roundTo(c.amount - t, decimals);
    d.amount = roundTo(d.amount - t, decimals);
    if (c.amount <= eps) i++;
    if (d.amount <= eps) j++;
  }
  return transfers;
}
