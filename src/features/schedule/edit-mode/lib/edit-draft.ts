import type { ScheduleItem } from "@/entities/schedule-item";

/** 편집 중인 여행 일정 — 날마다 일정 id 순서. 「완료」 전까지 여기만 바뀐다 */
export type EditDraft = string[][];

/** 일정 목록(position 순)을 날마다 id 순서로 */
export function draftOf(items: ScheduleItem[], totalDays: number): EditDraft {
  const days: EditDraft = Array.from({ length: totalDays }, () => []);
  for (const item of [...items].sort((a, b) => a.position - b.position)) {
    days[item.day_index]?.push(item.id);
  }
  return days;
}

/**
 * 지금 있는 일정만 남긴다 — 편집하는 동안 일행이 지운 일정은 초안에서 뺀다.
 * 남겨 두면 저장이 「이 여행의 일정이 아님」 으로 계속 거부되고, 화면 순서와 초안 순서가 어긋난다
 */
export function keepLive(draft: EditDraft, live: ReadonlySet<string>): EditDraft {
  return draft.map((d) => d.filter((id) => live.has(id)));
}

/**
 * 고를 수 있는 일정인지 — 항공편 카드(항공편에 연결된 줄)는 항공편 화면에서만 고치고 지운다(순서 끌기는 된다).
 * 연결 없는 옛 flight 줄은 다른 일정처럼 고른다
 */
export function isSelectable(item: Pick<ScheduleItem, "flight_id">): boolean {
  return item.flight_id === null;
}

/** 그날 안에서 from 번째를 to 번째로 옮긴다 */
export function reorder(draft: EditDraft, day: number, from: number, to: number): EditDraft {
  if (from === to) return draft;
  const list = [...draft[day]];
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  return draft.map((d, i) => (i === day ? list : d));
}

/** 고른 일정을 지운다 */
export function removeSelected(draft: EditDraft, selected: ReadonlySet<string>): EditDraft {
  return draft.map((d) => d.filter((id) => !selected.has(id)));
}

/**
 * 고른 일정을 그날 맨 끝으로 옮긴다(지금 순서대로).
 * 편집하는 동안 여행이 늘어 초안에 없는 날이면 빈 날을 채워 늘린다 — 늘리지 않으면 고른 일정이 어느 날에도 없어 지울 것으로 저장된다
 */
export function moveSelected(
  draft: EditDraft,
  selected: ReadonlySet<string>,
  day: number,
): EditDraft {
  const picked = draft.flat().filter((id) => selected.has(id));
  const rest = removeSelected(draft, selected);
  const days = Array.from({ length: Math.max(rest.length, day + 1) }, (_, i) => rest[i] ?? []);
  return days.map((d, i) => (i === day ? [...d, ...picked] : d));
}

/**
 * 저장할 것 — 처음과 순서가 달라진 날의 새 순서, 처음에 있었는데 사라진(지운) 일정.
 * 바뀐 게 없으면 둘 다 비어 있다
 */
export function editChanges(
  initial: EditDraft,
  draft: EditDraft,
): { days: Record<number, string[]>; deletes: string[] } {
  const days: Record<number, string[]> = {};
  draft.forEach((ids, day) => {
    if (ids.join() !== (initial[day] ?? []).join()) days[day] = ids;
  });
  const kept = new Set(draft.flat());
  return { days, deletes: initial.flat().filter((id) => !kept.has(id)) };
}

/** 하루 요약 100자 */
export const SUMMARY_MAX = 100;

/** 저장된 하루 요약(빈 날은 null, 기간보다 짧을 수 있다)을 날마다 글로 — 없는 날은 빈 글 */
export function summariesOf(saved: readonly (string | null)[], totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_, day) => saved[day] ?? "");
}

/** 저장할 하루 요약 — 앞뒤 공백을 뺀 글이 처음과 달라진 날만(빈 글이면 그날 요약을 지운다) */
export function summaryChanges(initial: string[], draft: string[]): Record<number, string> {
  const changed: Record<number, string> = {};
  draft.forEach((text, day) => {
    if (text.trim() !== (initial[day] ?? "").trim()) changed[day] = text.trim();
  });
  return changed;
}

/**
 * 초안이 지금 여행 기간보다 긴지 — 편집하는 동안 일행이 기간을 줄였다. 사라진 날이 초안에 남으면
 * 저장이 날 범위 검사(apply_schedule_edit, 0032)에 계속 막히므로 편집을 닫는다. 늘어난 건 초안을 늘려 받는다
 */
export function exceedsTripDays(
  draft: EditDraft,
  summaries: readonly string[],
  totalDays: number,
): boolean {
  return Math.max(draft.length, summaries.length) > totalDays;
}

/**
 * 편집 중 여행 기간이 바뀌었을 때 할 일 — 초안 · 하루 요약에 사라진 날이 남으면 "close"(닫고 알린다),
 * 초안은 맞는데 보고 있던 날만 사라졌으면 "lastDay"(마지막 날로 옮긴다, 다른 날의 편집은 지킨다), 아니면 null
 */
export function tripDaysChange(
  draft: EditDraft,
  summaries: readonly string[],
  totalDays: number,
  day: number,
): "close" | "lastDay" | null {
  if (exceedsTripDays(draft, summaries, totalDays)) return "close";
  return day >= totalDays ? "lastDay" : null;
}
