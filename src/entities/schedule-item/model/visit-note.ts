import type { Tables } from "@/shared/api/supabase/database.types";

/** 다녀온 장소의 기록 글 한 줄(0085) — 일정 × 사람에 하나 */
export type VisitNote = Tables<"visit_notes">;

/** 한 사람의 기록 글 — 일정 id → 글. 없는 일정은 아직 남기지 않았다 */
export type VisitNoteBodies = Readonly<Record<string, string>>;

/** 기록 글 최대 글자 수 — DB check 와 같다(0085) */
export const VISIT_NOTE_MAX = 200;

/** 그 사람이 남긴 기록 글만 일정 id 별로. 사람을 모르면(로그인 확인 전) 빈 값 */
export function noteBodiesOf(notes: readonly VisitNote[], userId: string | null): VisitNoteBodies {
  if (!userId) return {};
  return Object.fromEntries(
    notes.filter((n) => n.user_id === userId).map((n) => [n.item_id, n.body]),
  );
}

/** 저장할 글 — 앞뒤 공백을 뗀다. 빈 문자열이면 지우기 */
export function cleanNoteBody(text: string): string {
  return text.trim();
}
