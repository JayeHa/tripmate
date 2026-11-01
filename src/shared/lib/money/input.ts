import { decimalsOf } from "./currency";
import type { ExchangeRates } from "./types";

/** 여행 통화 — 기준 통화가 맨 앞 */
export function tripCurrencies(home: string, rates: ExchangeRates): string[] {
  return [home, ...Object.keys(rates).filter((c) => c !== home)];
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
