/**
 * 실시간 환율(하루 한 번 갱신) — 서버 라우트 `/api/live-rates` 가 ExchangeRate-API 응답을 이 모양으로 바꿔 보낸다.
 * rates 는 기준 통화 1 단위가 그 통화로 얼마인지(예: base KRW 면 JPY 0.1184). 여행에 넣은 환율(여행 환율)과는 따로 참고용으로만 쓴다
 * @see https://www.exchangerate-api.com/docs/free
 */
export type LiveRates = { base: string; updatedAt: string; rates: Record<string, number> };

/**
 * ExchangeRate-API 무료 주소의 응답 → LiveRates. 성공이 아니거나 모양이 다르면 null.
 * known 에 있는 통화만 남긴다(앱이 아는 통화 — 화면으로 보내는 크기를 줄인다)
 */
export function parseLiveRates(json: unknown, base: string, known: string[]): LiveRates | null {
  if (typeof json !== "object" || json === null) return null;
  const { result, base_code, time_last_update_unix, rates } = json as Record<string, unknown>;
  if (result !== "success" || base_code !== base || typeof time_last_update_unix !== "number")
    return null;
  if (typeof rates !== "object" || rates === null) return null;
  const kept = Object.entries(rates as Record<string, unknown>).filter(
    (e): e is [string, number] => known.includes(e[0]) && typeof e[1] === "number" && e[1] > 0,
  );
  return {
    base,
    updatedAt: new Date(time_last_update_unix * 1000).toISOString(),
    rates: Object.fromEntries(kept),
  };
}

/** 그 통화 unit 단위가 기준 통화로 얼마인지(「100엔 = 905원」 의 905). 모르는 통화면 null */
export function liveUnitValue(live: LiveRates, code: string, unit: number): number | null {
  const perBase = live.rates[code];
  return perBase ? unit / perBase : null;
}
