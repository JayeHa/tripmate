import { currencyInfo, decimalsOf, type ExchangeRates, roundTo, toHome } from "@/shared/lib/money";

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

/** 환율 칸에 칠 수 있는 모양 — 소수 넷째 자리까지 */
const RATE_TEXT = /^\d{1,7}(\.\d{1,4})?$/;

/** 환율 칸 글 → 값. 비었거나 모양이 다르거나 0 이하면 null */
export function parseRate(text: string): number | null {
  const t = text.trim();
  if (!RATE_TEXT.test(t)) return null;
  const n = Number(t);
  return n > 0 ? n : null;
}

/** 「지금 환율로」 넣을 값 — 화면에 보인 「지금 ₩844」 와 같게 기준 화폐 자릿수로 둥글린다 */
export function liveRateValue(live: number, home: string): number {
  return roundTo(live, decimalsOf(home));
}

/** 여행 환율 저장 실패 문구 — 오프라인 · 일행이 기준 화폐를 바꿈 · 일행이 그 통화를 지움 · 그 밖 */
export function rateSaveError(error: Error): string {
  if (error.name === "OfflineError") return error.message;
  if (error.message.includes("changed by someone else"))
    return "다른 사람이 기준 화폐를 바꿨어요. 화면을 새로 불러온 뒤 다시 해 주세요.";
  if (error.message.includes("currency not in trip"))
    return "다른 사람이 이 통화를 지웠어요. 화면을 새로 불러온 뒤 다시 해 주세요.";
  return "환율을 바꾸지 못했어요. 다시 시도해 주세요.";
}
