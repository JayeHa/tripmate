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
