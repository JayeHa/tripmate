import type { FareTotal, TransportFare } from "@/entities/transport-fare";
import { type ExchangeRates, formatMoney, toHome } from "@/shared/lib/money";

/**
 * 새 줄의 처음 통화 — 마지막에 고친 줄의 통화(지금도 여행 통화일 때) → 첫 외화 → 기준 통화.
 * 교통비는 현지 돈으로 적는 경우가 많아 외화를 먼저 고른다
 */
export function startFareCurrency(currencies: string[], fares: TransportFare[]): string {
  const last = fares
    .filter((f) => currencies.includes(f.currency))
    .toSorted((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  return last?.currency ?? currencies[1] ?? currencies[0];
}

/** 합계 한 줄 — 「¥2,700 + ₩20,000」. 비면 null */
export function totalsLabel(totals: FareTotal[], people = 1): string | null {
  if (totals.length === 0) return null;
  return totals.map((t) => formatMoney(t.amount * people, t.currency)).join(" + ");
}

/**
 * 합계를 기준 통화로 — 「≈ ₩24,840」. 기준 통화만 있거나 환율이 없는 통화가 있으면 null(어림값이 틀리게 보이지 않게)
 */
export function homeApprox(totals: FareTotal[], home: string, rates: ExchangeRates): string | null {
  if (totals.length === 0 || totals.every((t) => t.currency === home)) return null;
  try {
    const sum = totals.reduce((s, t) => s + toHome(t.amount, t.currency, home, rates), 0);
    return `≈ ${formatMoney(sum, home)}`;
  } catch {
    return null;
  }
}
