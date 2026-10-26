import { currencyInfo, type ExchangeRates, toHome } from "@/shared/lib/money";

/** 키패드로 칠 수 있는 자릿수 */
const MAX_DIGITS = 8;

/**
 * 키 하나를 누른 뒤의 금액 글 — 숫자 · 「00」 은 뒤에 붙이고(앞자리 0 은 버림, 8자리까지), 「⌫」 는 끝 한 자리를 지운다
 */
export function pressKey(amount: string, key: string): string {
  if (key === "⌫") return amount.slice(0, -1);
  const next = (amount + key).replace(/^0+/, "");
  return next.length > MAX_DIGITS ? amount : next;
}

/** 빠른 칩으로 더한 금액 — 8자리를 넘으면 그대로 */
export function addAmount(amount: string, add: number): string {
  const next = String((Number(amount) || 0) + add);
  return next.length > MAX_DIGITS ? amount : next;
}

/**
 * 금액을 반대쪽 통화로 — 기준 화폐 ↔ 여행지 통화, 여행 환율로. 환율이 없으면 null
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  home: string,
  rates: ExchangeRates,
): number | null {
  if (from === to) return amount;
  if (to === home) return rates[from] ? toHome(amount, from, home, rates) : null;
  const rate = rates[to];
  if (!rate || rate.value <= 0) return null;
  return (amount * rate.unit) / rate.value;
}

/** 1 · 2 · 5 × 10ⁿ 중 n 을 넘지 않는 가장 큰 수 — 칩 금액을 둥글게 */
function nice(n: number): number {
  const p = 10 ** Math.floor(Math.log10(n));
  const m = [5, 2, 1].find((x) => x * p <= n) ?? 1;
  return m * p;
}

/**
 * 빠른 칩 세 개 — 대략 1만 · 5만 · 10만 원어치를 그 통화의 둥근 수로(엔은 1,000 · 5,000 · 10,000).
 * 통화 표의 대략 환율을 쓴다(칩 금액은 정확할 필요가 없다). 모르는 통화면 원 기준 그대로
 */
export function quickAmounts(currency: string): number[] {
  const perKrw = currencyInfo(currency)?.perKrw ?? 1;
  return [10_000, 50_000, 100_000].map((krw) => nice(krw / perKrw));
}
