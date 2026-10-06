import type { Tables } from "@/shared/api/supabase/database.types";
import { byCreatedAt } from "@/shared/lib/created-at";

/** 일정에 붙는 메모 하나(0027) — 작성자 · 본문 · ★ 중요 · 링크 */
export type Memo = Tables<"memos">;

/** 메모 작성자 표시 — 이름(아바타 첫 글자) · 사진. 모르면(나간 멤버 · 지운 계정) null */
export type MemoAuthor = { name: string; avatarUrl: string | null };

/** 메모 본문 최대 길이 — DB check 와 같다 */
export const MEMO_MAX = 500;

/** 메모를 쓴 순서로 비교한다(shared 의 byCreatedAt) */
export { byCreatedAt };

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
