import { currencyName, type ExchangeRates } from "@/shared/lib/money";

/** 여행 환율의 단위 — 100엔 기준이면 100. 여행 환율이 없는 통화는 1 */
export function rateUnit(currency: string, rates: ExchangeRates): number {
  return rates[currency]?.unit ?? 1;
}

/** 「100엔 당」 · 「1달러 당」 — 환율 칸 옆 단위 */
export function perUnitLabel(currency: string, rates: ExchangeRates): string {
  return `${rateUnit(currency, rates)}${currencyName(currency)} 당`;
}

/** 소수 계산 찌꺼기(920.0000001)를 지운다 — 저장 칸(`expenses.rate`, numeric(18, 8))과 같은 8자리 */
function clean(value: number): number {
  return Number(value.toFixed(8));
}

/**
 * 환율 칸에 처음 보일 값 — 이 비용 환율(1단위 값)을 여행 환율 단위로 곱한 값, 없으면 여행 기본 환율, 그것도 없으면 빈 칸.
 * 저장하는 환율(`expenses.rate`)은 1단위 값이라 화면의 「100엔 당」 과 단위가 다르다
 */
export function rateDraftOf(currency: string, rates: ExchangeRates, rate: number | null): string {
  if (rate !== null) return String(clean(rate * rateUnit(currency, rates)));
  const base = rates[currency];
  return base ? String(base.value) : "";
}

/**
 * 칸의 글 → 저장할 1단위 환율. 숫자가 아니거나 0 이하면 undefined(저장하지 않는다),
 * 여행 기본 환율과 같으면 null — 이 비용만의 환율로 남기지 않고 여행 환율을 따른다(여행 환율을 고치면 함께 바뀐다)
 */
export function rateFromDraft(
  draft: string,
  currency: string,
  rates: ExchangeRates,
): number | null | undefined {
  const value = Number(draft.replace(/,/g, "").trim());
  if (!draft.trim() || !Number.isFinite(value) || value <= 0) return undefined;
  const base = rates[currency];
  if (base && Math.abs(base.value - value) < 1e-6) return null;
  return clean(value / rateUnit(currency, rates));
}
