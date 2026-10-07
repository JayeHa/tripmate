import { currencyName, type ExchangeRates } from "@/shared/lib/money";

/**
 * PC 표 머리 아래 한 줄 — 쓰인 외화마다 여행 기본 환율 「엔 920 · 달러 1,400 기준」(그 통화의 기준 단위 값).
 * 기준 화폐 · 환율이 없는 통화는 뺀다. 보일 것이 없으면 null
 */
export function baseRateLine(
  currencies: string[],
  home: string,
  rates: ExchangeRates,
): string | null {
  const parts = [...new Set(currencies)]
    .filter((c) => c !== home && rates[c])
    .map(
      (c) =>
        `${currencyName(c)} ${rates[c].value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`,
    );
  return parts.length ? `${parts.join(" · ")} 기준` : null;
}
