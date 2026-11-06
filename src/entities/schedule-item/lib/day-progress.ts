import type { ScheduleItem } from "../model/types";
import type { VisitMarks } from "../model/visit";

/**
 * 하루의 진행 — 오늘 어디까지 다녀왔는지. 홈 「오늘」 카드의 다음 장소와 일정 화면의 「다녀온 일정」(회색)이 같은 기준을 쓴다.
 * 기준은 다녀감 표시(다녀왔어요 · 패스, 일행 공유)뿐이다 — 시각이 지나도 표시가 없으면 남은 곳이다(2026-11-06 사용자 결정)
 */

/** 다녀온 일정의 종류 — 다녀왔다 · 패스(일정엔 넣었지만 가지 않았다) */
export type PastKind = "done" | "skipped";

/** 그날의 장소 일정(대체 장소 · 메모 · 항공편은 빼고), 순서대로 */
export function dayPlaces(items: readonly ScheduleItem[], dayIndex: number): ScheduleItem[] {
  return items
    .filter((i) => i.day_index === dayIndex && i.kind === "place" && i.alternative_of === null)
    .sort((a, b) => a.position - b.position);
}

/** 「HH:mm」 — 시간이 없으면 null */
export function itemHHmm(item: ScheduleItem): string | null {
  return item.start_time?.slice(0, 5) ?? null;
}

/**
 * 그날 다음 장소의 자리(dayPlaces 의 순번) — 표시(다녀왔어요 · 패스)가 없는 첫 장소. 장소 수와 같으면 다 마쳤다.
 * 뒤의 장소를 먼저 표시해도 앞의 표시 없는 장소가 다음이다(건너뛴 곳은 「패스」 로 표시한다)
 */
export function nextPlaceIndex(
  items: readonly ScheduleItem[],
  dayIndex: number,
  marks: VisitMarks,
): number {
  const places = dayPlaces(items, dayIndex);
  const index = places.findIndex((p) => !marks[p.id]);
  return index === -1 ? places.length : index;
}

/**
 * 다녀온 일정 — 오늘까지의 날에서 표시한 줄(다녀왔어요 = done, 패스 = skipped). 표시 없는 줄 · 항공편 · 날짜 메모 카드는 넣지 않는다.
 * 오늘 뒤의 날은 표시가 있어도 넣지 않는다. 대체 장소는 원래 일정을 따른다.
 * 오늘의 다음 장소 id 도 함께 돌려준다(다 마쳤으면 null) — 일정 화면이 들어갈 때 그 줄로 간다
 */
export function dayProgress(
  items: readonly ScheduleItem[],
  todayIndex: number,
  marks: VisitMarks,
): { past: Map<string, PastKind>; nextId: string | null } {
  const places = dayPlaces(items, todayIndex);
  const next = places[nextPlaceIndex(items, todayIndex, marks)] ?? null;
  const kindOf = (id: string): PastKind => (marks[id] === "skipped" ? "skipped" : "done");
  const main = items.filter(
    (i) => i.alternative_of === null && i.day_index <= todayIndex && marks[i.id],
  );
  const past = new Map(main.map((i) => [i.id, kindOf(i.id)]));
  for (const alt of items) {
    const kind = alt.alternative_of === null ? undefined : past.get(alt.alternative_of);
    if (kind) past.set(alt.id, kind);
  }
  return { past, nextId: next?.id ?? null };
}
