import type { Tables } from "@/shared/api/supabase/database.types";

/** 다녀온 장소의 기록 글 한 줄(0085 · 0088) — 일정에 하나, 일행이 함께 쓰고 마지막으로 고친 사람이 남는다 */
export type VisitNote = Tables<"visit_notes">;

/** 기록 글 — 일정 id → 그 일정의 글. 없는 일정은 아직 아무도 남기지 않았다 */
export type VisitNotesByItem = Readonly<Record<string, VisitNote>>;

/** 기록 글 최대 글자 수 — DB check 와 같다(0085) */
export const VISIT_NOTE_MAX = 200;

/** 기록 글을 일정 id 별로 */
export function notesByItem(notes: readonly VisitNote[]): VisitNotesByItem {
  return Object.fromEntries(notes.map((n) => [n.item_id, n]));
}

/** 저장할 글 — 앞뒤 공백을 뗀다. 빈 문자열이면 지우기 */
export function cleanNoteBody(text: string): string {
  return text.trim();
}
