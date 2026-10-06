import { toHomeFor } from "@/entities/expense";
import { currencyName, type ExchangeRates, MissingRateError } from "@/shared/lib/money";

/** 환율 값 — 소수는 둘째 자리까지 */
function rateNumber(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

/**
 * 금액 아래 환율 한 줄 — 「엔 920 기준」(여행 기본 환율, 그 통화의 기준 단위 값) · 「엔 905 · 이 비용만」(이 지출에만 적은 환율).
 * 기준 화폐면 null, 기본 환율도 이 지출 환율도 없으면 「엔 환율이 없어요」.
 * `rate` 는 1단위 값이라 여행 환율의 단위(100엔)를 곱해 같은 단위로 보인다
 */
export function rateLine(
  currency: string,
  home: string,
  rates: ExchangeRates,
  rate: number | null,
): string | null {
  if (currency === home) return null;
  const name = currencyName(currency);
  const base = rates[currency];
  if (rate === null)
    return base ? `${name} ${rateNumber(base.value)} 기준` : `${name} 환율이 없어요`;
  const own = rate * (base?.unit ?? 1);
  const same = base && Math.abs(own - base.value) < 1e-6;
  return `${name} ${rateNumber(own)} ${same ? "기준" : "· 이 비용만"}`;
}

/** 금액을 기준 화폐로. 기준 화폐면 그대로, 환율이 없으면 null */
export function homeAmountOrNull(
  amount: number,
  currency: string,
  rate: number | null,
  home: string,
  rates: ExchangeRates,
): number | null {
  try {
    return toHomeFor({ currency, rate }, amount, home, rates);
  } catch (e) {
    if (e instanceof MissingRateError) return null;
    throw e;
  }
}
