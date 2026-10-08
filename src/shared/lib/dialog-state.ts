/**
 * 창 상태의 다음 값 계산 — `use-dialog-state.ts` 의 훅이 렌더 중에 이 값으로 상태를 맞춘다.
 * 훅과 떼어 둔 건 테스트하려고(이 레포는 훅을 그리는 테스트 도구를 두지 않는다)
 */

/** 붙잡아 둘 값 — 열려 있는 동안은 받은 값을 따라가고, 닫혀 있으면 마지막 값을 그대로 둔다 */
export function nextHeld<T>(held: T, open: boolean, value: T): T {
  return open ? value : held;
}

export type OpenCount = { open: boolean; count: number };

/** 닫힘 → 열림마다 1 늘린다. 열린 채 · 닫힌 채면 그대로 */
export function nextOpenCount(prev: OpenCount, open: boolean): OpenCount {
  if (open === prev.open) return prev;
  return { open, count: open ? prev.count + 1 : prev.count };
}
