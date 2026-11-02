/**
 * 기기별 저장값 키 — 여행마다 새 비용에서 마지막에 저장한 결제한 사람(`{ [tripId]: "m:…" }`).
 * 여행 중에 일행의 결제 내역을 보며 한 기기로 몰아 입력하는 일이 많아, 다음 비용도 같은 사람으로 시작한다(2026-11-02 사용자 요청)
 */
const KEY = "tm-exp-last-payer";

/** 저장된 묶음. 없거나 읽지 못하면(사생활 모드 · 막힌 저장소 · 깨진 값) 빈 묶음 */
function readAll(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** 이 여행에서 마지막에 저장한 결제한 사람 — 지금 고를 수 있는 사람(keys)일 때만, 아니면 null(나로 시작) */
export function readLastPayer(tripId: string, keys: readonly string[]): string | null {
  const value = readAll()[tripId];
  return typeof value === "string" && keys.includes(value) ? value : null;
}

/** 새 비용을 저장할 때 결제한 사람을 기억한다. 「각자 냄」(결제자 없음)이면 그대로 둔다. 저장하지 못해도 화면은 그대로 간다 */
export function rememberPayer(tripId: string, payer: string | null) {
  if (!payer) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [tripId]: payer }));
  } catch {
    // 저장소가 막혀 있다 — 다음 비용은 나로 시작한다
  }
}
