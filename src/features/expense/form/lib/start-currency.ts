/**
 * 새 비용의 처음 통화 —
 * ① 이 여행에서 마지막에 고른 통화(지금도 여행 통화에 있을 때만) → ② 이 여행 비용에서 가장 많이 쓴 통화(같으면 여행 통화 순서) →
 * ③ 여행 환율의 첫 외화 → ④ 기준 통화.
 * 여행 환율(jsonb)은 넣은 순서를 기억하지 않아(키를 정렬해 저장) 「처음 넣은 통화」 는 알 수 없다 — 그래서 쓴 기록을 본다
 * @param currencies 기준 통화가 맨 앞인 여행 통화 목록
 */
export function startCurrency(
  currencies: string[],
  remembered: string | null,
  used: string[],
): string {
  if (remembered && currencies.includes(remembered)) return remembered;
  const counts = new Map<string, number>();
  for (const c of used) if (currencies.includes(c)) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best: string | null = null;
  for (const c of currencies) {
    if ((counts.get(c) ?? 0) > (best ? (counts.get(best) ?? 0) : 0)) best = c;
  }
  return best ?? currencies[1] ?? currencies[0];
}
