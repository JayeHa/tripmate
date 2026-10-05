/** 스크롤 강조 후보. `top` 은 화면(viewport) 기준 행의 윗변 */
export type FocusCandidate = { id: string; top: number };

/**
 * 기준선을 지난(윗변이 기준선과 같거나 위) 마지막 장소. 아직 아무것도 지나지 않았으면 첫 장소.
 * 후보는 목록 순서(위 → 아래)로 받는다. 후보가 없으면 null.
 */
export function pickFocus(candidates: FocusCandidate[], line: number): string | null {
  let picked = candidates[0]?.id ?? null;
  for (const c of candidates) {
    if (c.top > line) break;
    picked = c.id;
  }
  return picked;
}

/**
 * 핀으로 고른 행이 「기준선 − margin」에 오도록 스크롤할 위치. 그러면 다시 골라도 그 행이다.
 * 기준선이 스크롤 위치에 따라 움직일 수 있어서(`lineAt`) 이분 탐색으로 찾는다.
 * `lineAt` 은 스크롤이 내려갈수록 같거나 아래로만 가야 한다. 범위 밖이면 끝(0 · maxScroll)에서 멈춘다.
 *
 * @param rowTop 지금 행 윗변의 화면 y
 * @param scrollTop 지금 스크롤 위치
 * @param lineAt 스크롤 위치 → 기준선의 화면 y
 */
export function pinScrollTarget(
  rowTop: number,
  scrollTop: number,
  maxScroll: number,
  lineAt: (scrollTop: number) => number,
  margin: number,
): number {
  // 스크롤 t 에서 「행 윗변 − (기준선 − margin)」. t 가 커질수록 줄어든다
  const gap = (t: number) => rowTop - (t - scrollTop) - (lineAt(t) - margin);
  if (gap(0) <= 0) return 0;
  if (gap(maxScroll) >= 0) return maxScroll;
  let lo = 0;
  let hi = maxScroll;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  return Math.round(hi);
}

/** 이어서 보기의 날짜 묶음. `top` 은 화면 기준 그 날짜 머리의 윗변 */
export type DaySectionTop = { day: number; top: number };

/**
 * 지금 보고 있는 날 — 머리가 기준선(목록이 보이기 시작하는 곳)을 지난 마지막 날짜. 아직 아무것도 지나지 않았으면 첫 날짜.
 * 묶음은 위 → 아래 순서로 받는다. 묶음이 없으면 null
 */
export function pickVisibleDay(sections: DaySectionTop[], line: number): number | null {
  let picked = sections[0]?.day ?? null;
  for (const s of sections) {
    if (s.top > line) break;
    picked = s.day;
  }
  return picked;
}

/** 지도가 핀을 그릴 날을 고르는 데 쓰는 날짜 묶음 — 그 날의 줄 id 들 */
export type DayRowIds = { day: number; rows: { item: { id: string } }[] };

/**
 * 지도가 핀을 그릴 날 — 강조된 장소가 있으면 그 장소의 날, 없으면 보고 있는 날.
 * 「보고 있는 날」 은 날짜 머리가 목록 위를 지날 때 바뀌고 강조 기준선은 그보다 아래라, 날짜 경계에서는
 * 다음 날의 첫 장소가 먼저 강조된다. 그때 지도가 보고 있는 날만 따르면 강조된 장소의 핀이 없다
 */
export function mapDayOf(sections: DayRowIds[], focusId: string | null, day: number): number {
  if (focusId === null) return day;
  return sections.find((s) => s.rows.some((r) => r.item.id === focusId))?.day ?? day;
}
