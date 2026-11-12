import type {
  MapRecordTone,
  RouteDay,
  RouteMapRecord,
  StopTone,
  TimelineRow,
  VisitMark,
  VisitMarks,
} from "@/entities/schedule-item";

/** 역 하나의 방문 모양 — 표식 · 카드와 지나왔는지(기록 모드) */
export type RecordStop = {
  tone: StopTone;
  /** 이 역까지 왔다 — 이 역으로 들어오는 구간이 「지나온 구간」(초록, 기록 모드) */
  reached: boolean;
  /** 그날 표시 없는 첫 장소 — 큰 「패스」 · 「✓ 다녀왔어요」 를 둔다(기록 모드 · 누를 수 있는 날만) */
  next: boolean;
  /** 계획 모드 · 여행 중 오늘 다녀온 곳 — 흐리게 + 「✓ 다녀옴」 칩 */
  dim: boolean;
};

/** 그 날이 여행 중 오늘인지 · 오늘 앞의 날인지 · 그 밖(오늘 뒤 · 여행 전후)인지 */
export type RecordDay = "today" | "past" | "other";

/** 진행을 칠할 역 — 장소인지(항공편은 세지 않는다) */
export type RecordInput = { id: string; place: boolean };

/**
 * 하루 노선도의 기록 모드 상태. 진행은 장소만 센다 — 항공편은 계획 모양 그대로 둔다(2026-11-10 사용자 결정).
 * - 다녀왔어요 = done, 패스 = pass(회색 한 줄), 남은 곳 = todo. 순서와 상관없이 표시한다
 * - 표시가 없는 첫 장소(next)에 큰 「패스」 · 「✓ 다녀왔어요」 — 누를 수 있는 날(여행 중 오늘까지)만.
 *   그중 오늘만 「지금 여기」(current) 모양이다. 지난 날의 남은 장소는 남은 모양에 버튼만 — 지금 위치는 하나다
 * - 지나온 구간 = 도착 역을 다녀온 구간만. 항공편은 그 뒤 장소를 하나라도 다녀왔으면 지나왔다
 */
export function recordStops(
  stops: readonly RecordInput[],
  marks: VisitMarks,
  when: RecordDay,
): RecordStop[] {
  const next = when !== "other" ? stops.findIndex((s) => s.place && !marks[s.id]) : -1;
  const visitedAfter = (i: number) =>
    stops.some((s, j) => j > i && s.place && marks[s.id] === "visited");
  return stops.map((s, i) => ({
    tone: toneOf(s, i === next && when === "today", marks),
    reached: s.place ? marks[s.id] === "visited" : visitedAfter(i),
    next: i === next,
    dim: false,
  }));
}

/** 기록 모드 역 하나의 모양 */
function toneOf(s: RecordInput, current: boolean, marks: VisitMarks): StopTone {
  if (!s.place) return "plan";
  if (marks[s.id] === "visited") return "done";
  if (marks[s.id] === "skipped") return "pass";
  return current ? "current" : "todo";
}

/** 계획 모드의 표시 → 모양 */
const PLAN_TONE: Record<VisitMark, StopTone> = { visited: "visited", skipped: "pass" };

/**
 * 하루 노선도의 계획 모드 상태 — 다녀온 곳은 ✓ 표식(visited), 패스는 회색 한 줄(pass), 나머지는 계획 모양.
 * 흐림 + 「✓ 다녀옴」 칩은 여행 중 오늘만 — 지난 날 · 여행이 끝난 뒤에는 다녀옴이 기본이라 표식만 둔다
 */
export function planStops(
  stops: readonly RecordInput[],
  marks: VisitMarks,
  when: RecordDay,
): RecordStop[] {
  return stops.map((s) => {
    const mark = s.place ? marks[s.id] : undefined;
    const tone = mark ? PLAN_TONE[mark] : "plan";
    return { tone, reached: false, next: false, dim: tone === "visited" && when === "today" };
  });
}

/** 그 날(0-base)이 여행 중 오늘 · 오늘 앞 · 그 밖. 여행 중이 아니면(todayIndex null) 모두 그 밖 */
export function recordDay(day: number, todayIndex: number | null): RecordDay {
  if (todayIndex === null || day > todayIndex) return "other";
  return day === todayIndex ? "today" : "past";
}

/** 노선도의 역 → 판정 입력 */
function inputsOf(route: RouteDay): RecordInput[] {
  return route.stops.map((s) => ({ id: s.row.item.id, place: s.row.kind === "place" }));
}

/** 하루 노선도의 역마다 기록 모드 상태(역 순서 그대로) — 장소만 진행에 센다 */
export function recordOfRoute(route: RouteDay, marks: VisitMarks, when: RecordDay): RecordStop[] {
  return recordStops(inputsOf(route), marks, when);
}

/** 하루 노선도의 역마다 계획 모드 상태(역 순서 그대로) */
export function planOfRoute(route: RouteDay, marks: VisitMarks, when: RecordDay): RecordStop[] {
  return planStops(inputsOf(route), marks, when);
}

/** 기록 모드 지도에 넘길 장소별 모양 · 지나왔는지. 계획 모양(항공편)은 null */
export function routeMapRecord(route: RouteDay, tones: readonly RecordStop[]): RouteMapRecord {
  return new Map(
    route.stops.map((s, i) => {
      const { tone, reached } = tones[i];
      return [s.row.item.id, { tone: mapTone(tone), reached }];
    }),
  );
}

/** 지도 핀의 기록 모양 — 계획 모양(항공편)은 null */
function mapTone(tone: StopTone): MapRecordTone | null {
  if (tone === "plan" || tone === "visited") return null;
  return tone;
}

/** 「✓ 다녀왔어요」 를 둘 장소(그날 표시 없는 첫 장소, 누를 수 있는 날만). 없으면 null */
export function nextStopId(route: RouteDay, tones: readonly RecordStop[]): string | null {
  const i = tones.findIndex((t) => t.next);
  return i === -1 ? null : route.stops[i].row.item.id;
}

/** 그날 장소 수와 다녀온 곳 · 패스한 곳 수 — 진행 막대(항공편 · 노트는 세지 않는다) */
export function placeProgress(
  rows: readonly TimelineRow[],
  marks: VisitMarks,
): { done: number; passed: number; total: number } {
  const places = rows.filter((r) => r.kind === "place");
  return {
    done: places.filter((r) => marks[r.item.id] === "visited").length,
    passed: places.filter((r) => marks[r.item.id] === "skipped").length,
    total: places.length,
  };
}
