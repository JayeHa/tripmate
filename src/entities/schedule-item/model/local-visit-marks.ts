import type { VisitMark, VisitMarks } from "./visit";

/** 예전 기기별 표시(여행 id → 일정 id → 표시) — 일행 공유(0083)로 바뀌어 한 번 올린 뒤 지운다 */
const KEY = "tm-visit-marks";
/** 그보다 앞의 「들른 수」 기록 — 읽지 않고 지운다 */
const OLD_KEY = "tm-home-visited";

/** 이 기기에 남은 그 여행의 예전 표시 — 없거나 모양이 다르거나 저장소가 막혔으면 빈 기록 */
export function readLocalMarks(tripId: string): VisitMarks {
  try {
    localStorage.removeItem(OLD_KEY);
    const all: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const marks: unknown = (all as Record<string, unknown> | null)?.[tripId];
    if (typeof marks !== "object" || marks === null || Array.isArray(marks)) return {};
    return Object.fromEntries(
      Object.entries(marks).filter(
        (e): e is [string, VisitMark] => e[1] === "visited" || e[1] === "skipped",
      ),
    );
  } catch {
    return {};
  }
}

/** 그 여행의 예전 표시를 지운다 — 남은 여행이 없으면 키도 지운다. 막혔으면 그대로 둔다 */
export function clearLocalMarks(tripId: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, unknown>;
    delete all[tripId];
    if (Object.keys(all).length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // 모양이 다르면 통째로 지운다. 저장소가 막혔으면 다음 방문에 다시 한다
    try {
      localStorage.removeItem(KEY);
    } catch {
      // 막혔다
    }
  }
}
