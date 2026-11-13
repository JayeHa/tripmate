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
 * `lineAt` 은 스크롤 1 에 행보다 빨리(1 넘게) 올라가면 안 된다 — 그래야 「행 − 기준선」 이 스크롤에 따라 줄기만 한다. 범위 밖이면 끝(0 · maxScroll)에서 멈춘다.
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

/** 고른 장소가 지금 그린 날짜 안에 있을 때만 그 id(PC 하루씩 보기로 다른 날에 가면 고른 것이 없다) */
export function shownOpenId(openId: string | null, shown: DayRowIds[]): string | null {
  return shown.some((s) => s.rows.some((r) => r.item.id === openId)) ? openId : null;
}

/**
 * PC 스크롤 강조 기준선(화면 y) = 목록 칸 높이의 40% 지점(가운데보다 조금 위).
 * PC 는 목록이 길게 보여서, 맨 위보다 눈이 머무는 가운데 근처의 장소를 지도에 보인다.
 * 다만 맨 위에서는 120px 에서 시작해 스크롤한 만큼 내려간다 — 처음부터 40% 면 그 위의 첫 행들은
 * 기준선을 지나지 않은 적이 없어서 강조될 수 없다. 목록 칸이 아직 없으면 0
 */
export function pcFocusLine(list: { top: number; height: number } | undefined, scrollTop: number) {
  if (!list) return 0;
  return list.top + Math.min(list.height * 0.4, scrollTop + 120);
}

/** 보던 자리의 후보 — 날짜 머리 · 장소 줄의 화면 y(위 · 아래 변) */
export type AnchorCandidate = { top: number; bottom: number };

/**
 * 「보던 자리」 로 삼을 후보의 순서 — 기준선에 걸친 것, 없으면 기준선 아래 첫 번째.
 * 다만 걸친 것의 윗변보다 그 다음 것의 윗변이 기준선에 더 가까우면 다음 것 — 거의 다 지나간 날짜 머리 · 카드는
 * 보이는 부분(아래쪽)의 높이가 바뀌므로, 그 윗변을 지키면 정작 보고 있던 다음 장소가 밀린다.
 * 후보는 목록 순서(위 → 아래)로 받는다. 모두 기준선 위로 지나갔으면(후보가 없어도) null.
 * 목록 내용이 바뀐 뒤 이 후보의 윗변을 같은 높이에 돌려 놓으면, 위쪽이 길어지거나 짧아져도 보던 것이 그대로 있다
 */
export function pickAnchor(candidates: readonly AnchorCandidate[], line: number): number | null {
  const at = candidates.findIndex((c) => c.bottom > line);
  if (at === -1) return null;
  const next = candidates[at + 1];
  const nextIsNearer = next && Math.abs(next.top - line) < Math.abs(candidates[at].top - line);
  return nextIsNearer ? at + 1 : at;
}
