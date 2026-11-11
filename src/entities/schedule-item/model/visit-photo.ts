import type { Tables } from "@/shared/api/supabase/database.types";

/** 다녀온 장소의 기록 사진 한 장(0086) — 일정 × 사람에 10장까지 */
export type VisitPhoto = Tables<"visit_photos">;

/** 한 사람의 기록 사진 — 일정 id → 놓는 순서대로. 없는 일정은 아직 붙이지 않았다 */
export type VisitPhotosByItem = Readonly<Record<string, readonly VisitPhoto[]>>;

/** 그 사람이 붙인 사진만 일정 id 별로, 순서(position) → 올린 순. 사람을 모르면(로그인 확인 전) 빈 값 */
export function photosByItem(
  photos: readonly VisitPhoto[],
  userId: string | null,
): VisitPhotosByItem {
  if (!userId) return {};
  const out: Record<string, VisitPhoto[]> = {};
  const mine = photos
    .filter((p) => p.user_id === userId)
    .toSorted((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  for (const p of mine) (out[p.item_id] ??= []).push(p);
  return out;
}
