/** 기기별 저장값 키 — 여행마다 새 비용에서 마지막에 고른 통화(`{ [tripId]: "JPY" }`) */
const KEY = "tm-exp-last-cur";

/** 저장된 묶음. 없거나 읽지 못하면(사생활 모드 · 막힌 저장소 · 깨진 값) 빈 묶음 */
function readAll(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** 이 여행에서 마지막에 고른 통화. 없으면 null */
export function readLastCurrency(tripId: string): string | null {
  const value = readAll()[tripId];
  return typeof value === "string" ? value : null;
}

/** 새 비용에서 고른 통화를 기억한다. 저장하지 못해도 화면은 그대로 간다 */
export function rememberCurrency(tripId: string, currency: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [tripId]: currency }));
  } catch {
    // 저장소가 막혀 있다 — 다음 입력은 다른 규칙(가장 많이 쓴 통화)으로 고른다
  }
}
