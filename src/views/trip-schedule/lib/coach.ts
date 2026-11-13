/** 일정 화면의 첫 사용 말풍선 — 「계획 | 기록」 · 「🗺 동선 보기」(모바일만) · 다녀왔어요 · 패스 */
export type TipId = "mode" | "map" | "visit";

/** 말풍선마다 본 적이 있는지 — 기기별로 기억한다 */
export type TipSeen = Record<TipId, boolean>;

/**
 * 말풍선이 가리킬 요소(`data-coach`)의 CSS 선택자. 다녀왔어요 · 패스는 큰 버튼 줄(`visit-now`) · 펼친 카드의 토글 줄(`visit-row`)
 * 어느 쪽이든 — 그중 화면에 보이는 것을 가리킨다
 */
export const TIP_ANCHOR: Record<TipId, string> = {
  mode: '[data-coach="mode"]',
  map: '[data-coach="map"]',
  visit: '[data-coach^="visit"]',
};

/**
 * 지금 띄울 말풍선 — 「계획 | 기록」 → 「🗺 동선 보기」(모바일만) → 다녀왔어요 · 패스 순서로 아직 안 본 첫 번째.
 * 다 봤으면 null. 가리킬 버튼이 화면에 보일 때만 그려진다
 */
export function currentTip(seen: TipSeen, mobile: boolean): TipId | null {
  if (!seen.mode) return "mode";
  if (mobile && !seen.map) return "map";
  return seen.visit ? null : "visit";
}

/**
 * 말풍선 밖을 눌러 닫은 뒤의 본 것. 모바일의 「계획 | 기록」 에서 닫으면 이어지는 「🗺 동선 보기」 도 본 것으로 한다 —
 * 닫았는데 다음 말풍선이 바로 뜨지 않게
 */
export function closedSeen(seen: TipSeen, tip: TipId, mobile: boolean): TipSeen {
  if (tip === "mode" && mobile) return { ...seen, mode: true, map: true };
  return { ...seen, [tip]: true };
}
