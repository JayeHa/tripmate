import type { ExchangeRates } from "./types";

const CURRENCY_DECIMALS: Record<string, number> = {
  KRW: 0,
  JPY: 0,
  VND: 0,
  TWD: 0,
  USD: 2,
  EUR: 2,
  CNY: 2,
  THB: 2,
};

/** 통화를 부르는 이름 — 금액 옆 단위 · 「엔 920 기준」 에 쓴다 */
const CURRENCY_NAME: Record<string, string> = {
  KRW: "원",
  JPY: "엔",
  USD: "달러",
  EUR: "유로",
  CNY: "위안",
  THB: "바트",
  VND: "동",
  TWD: "대만 달러",
};

/** 통화 이름. 모르는 통화는 코드 그대로 */
export function currencyName(currency: string): string {
  return CURRENCY_NAME[currency] ?? currency;
}

export function decimalsOf(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? 2;
}

export function roundTo(amount: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((amount + Number.EPSILON) * f) / f;
}

export class MissingRateError extends Error {
  constructor(public currency: string) {
    super(`${currency} 환율이 설정되지 않았습니다`);
    this.name = "MissingRateError";
  }
}

/** 금액을 홈 화폐로 환산. 반올림하지 않음 (합산 후 한 번만 반올림) */
export function toHome(
  amount: number,
  currency: string,
  home: string,
  rates: ExchangeRates,
): number {
  if (currency === home) return amount;
  const rate = rates[currency];
  if (!rate || rate.unit <= 0) throw new MissingRateError(currency);
  // 곱한 뒤 나눈다 — 100엔 = 920원에서 100 × (920 / 100) 은 919.99… 가 된다
  return (amount * rate.value) / rate.unit;
}

export function formatMoney(amount: number, currency: string): string {
  const d = decimalsOf(currency);
  const n = roundTo(amount, d).toLocaleString("ko-KR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
  const symbol: Record<string, string> = { KRW: "₩", JPY: "¥", USD: "$", EUR: "€", CNY: "¥" };
  return symbol[currency] ? `${symbol[currency]}${n}` : `${n} ${currency}`;
}
