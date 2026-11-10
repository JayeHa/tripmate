/**
 * 가로로 넘긴 카드 줄이 멈춘 자리의 카드 — 맞춤 자리(`snaps[i]`, 그 카드를 왼쪽에 맞출 때의 scrollLeft)가
 * 지금 scrollLeft 에 가장 가까운 카드. 끝까지 넘겼으면 마지막 카드다 — 마지막 카드는 뒤에 칸이 없어
 * 왼쪽까지 오지 못하므로 거리로는 앞 카드가 고를 수 있다. 카드가 없으면 -1
 */
export function settledCardIndex(snaps: number[], scrollLeft: number, maxScroll: number): number {
  if (snaps.length === 0) return -1;
  if (scrollLeft >= maxScroll - 1) return snaps.length - 1;
  let best = 0;
  snaps.forEach((snap, i) => {
    if (Math.abs(snap - scrollLeft) < Math.abs(snaps[best] - scrollLeft)) best = i;
  });
  return best;
}
