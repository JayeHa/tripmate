import type { Tables } from "@/shared/api/supabase/database.types";

/** 일정에 붙는 메모 하나(0027) — 작성자 · 본문 · ★ 중요 · 링크 */
export type Memo = Tables<"memos">;

/** 메모 작성자 표시 — 이름(아바타 첫 글자) · 사진. 모르면(나간 멤버 · 지운 계정) null */
export type MemoAuthor = { name: string; avatarUrl: string | null };

/** 메모 본문 최대 길이 — DB check 와 같다 */
export const MEMO_MAX = 500;

/**
 * 쓴 순서(created_at)로 비교한다. 문자열로 비교하면 안 된다 — Postgres 는 소수 초가 0 이면 소수부를 빼고 내보내
 * 「…:05+00:00」 이 「…:05.5+00:00」 보다 뒤로 간다
 */
export function byCreatedAt(a: Memo, b: Memo): number {
  return Date.parse(a.created_at) - Date.parse(b.created_at);
}

/**
 * 메모를 일정 id 마다 모은다. 각 목록은 쓴 순서(created_at)
 */
export function memosByItem(memos: Memo[]): Map<string, Memo[]> {
  const byItem = new Map<string, Memo[]>();
  for (const memo of [...memos].sort(byCreatedAt)) {
    byItem.set(memo.schedule_item_id, [...(byItem.get(memo.schedule_item_id) ?? []), memo]);
  }
  return byItem;
}
