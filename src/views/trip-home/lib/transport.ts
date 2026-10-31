import type { FareTotal, TransportFare } from "@/entities/transport-fare";
import { decimalsOf, type ExchangeRates, formatMoney, toHome } from "@/shared/lib/money";

/** 여행 통화 — 기준 통화가 맨 앞 */
export function tripCurrencies(home: string, rates: ExchangeRates): string[] {
  return [home, ...Object.keys(rates).filter((c) => c !== home)];
}

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

/**
 * 입력한 금액 글자 → 숫자. 쉼표 · 단위 같은 다른 글자는 버리고, 소수 없는 통화(원 · 엔)는 점 뒤를 버린다.
 * 비었거나 숫자가 아니면 null(금액 없음)
 */
export function parseAmount(text: string, currency: string): number | null {
  const [whole, frac = ""] = text.replace(/[^\d.]/g, "").split(".");
  const decimals = decimalsOf(currency);
  const digits = decimals > 0 && frac ? `${whole}.${frac.slice(0, decimals)}` : whole;
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** 저장된 금액 → 입력 칸 글자(쉼표 없이). 없으면 빈 글자 */
export function amountDraft(amount: number | null): string {
  return amount === null ? "" : String(Number(amount));
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
