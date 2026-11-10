import type { StopTone, VisitMarks } from "@/entities/schedule-item";

/** 기록 모드의 역 하나 — 표식 · 카드 모양과 지나왔는지 */
export type RecordStop = {
  tone: StopTone;
  /** 이 역까지 왔다 — 이 역으로 들어오는 구간이 「지나온 구간」(초록) */
  reached: boolean;
};

/** 진행을 칠할 역 — 장소인지(항공편은 세지 않는다) */
export type RecordInput = { id: string; place: boolean };

/**
 * 하루 노선도의 기록 모드 상태. 진행은 장소만 센다 — 항공편은 계획 모양 그대로 둔다(2026-11-10 사용자 결정).
 * - 다녀왔어요 = done, 패스 · 남은 곳 = todo(패스는 칩으로 알린다)
 * - 지금 여기(current) = 표시가 없는 첫 장소. 「다녀왔어요」 를 누를 수 있는 날(여행 중 오늘까지)에만 있다
 * - 지나온 구간 = 도착 역이 지금 여기 이하. 그날 장소를 다 마쳤으면 모두 지나왔다.
 *   누를 수 없는 날(오늘 뒤 · 여행 전후)은 다녀온 역으로 들어오는 구간만 지나왔다
 */
export function recordStops(
  stops: readonly RecordInput[],
  marks: VisitMarks,
  markable: boolean,
): RecordStop[] {
  const current = markable ? stops.findIndex((s) => s.place && !marks[s.id]) : -1;
  const end = reachedEnd(current, markable, stops.length);
  return stops.map((s, i) => ({
    tone: toneOf(s, i, current, marks),
    reached: i <= end || marks[s.id] === "visited",
  }));
}

/** 여기까지(포함) 지나왔다 — 지금 여기까지, 다 마쳤으면 끝까지, 누를 수 없는 날은 없다(-1) */
function reachedEnd(current: number, markable: boolean, count: number): number {
  if (current !== -1) return current;
  return markable ? count : -1;
}

/** 역 하나의 모양 */
function toneOf(s: RecordInput, i: number, current: number, marks: VisitMarks): StopTone {
  if (!s.place) return "plan";
  if (marks[s.id] === "visited") return "done";
  return i === current ? "current" : "todo";
}
