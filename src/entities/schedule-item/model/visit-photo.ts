import type { Tables } from "@/shared/api/supabase/database.types";

/** 다녀온 장소의 기록 사진 한 장(0086 · 0088) — 일정에 10장까지, 일행이 함께 올린다. user_id = 올린 사람 */
export type VisitPhoto = Tables<"visit_photos">;

/** 기록 사진 — 일정 id → 놓는 순서대로. 없는 일정은 아직 아무도 붙이지 않았다 */
export type VisitPhotosByItem = Readonly<Record<string, readonly VisitPhoto[]>>;

/** 사진을 일정 id 별로(일행이 올린 것까지), 순서(position) → 올린 순 */
export function photosByItem(photos: readonly VisitPhoto[]): VisitPhotosByItem {
  const out: Record<string, VisitPhoto[]> = {};
  const sorted = photos.toSorted(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  );
  for (const p of sorted) (out[p.item_id] ??= []).push(p);
  return out;
}
