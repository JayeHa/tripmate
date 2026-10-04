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
