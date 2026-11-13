import type { Tables } from "@/shared/api/supabase/database.types";

/**
 * 다녀온 장소의 기록 사진 한 장(0086 · 0088) — 일정에 10장까지, 일행이 함께 올린다. user_id = 올린 사람.
 * 영상도 한 줄이다(0089) — `video_key` 가 있고, `photo_key` · `thumb_key` 는 그 영상의 표지
 */
export type VisitPhoto = Tables<"visit_photos">;

/** 영상 줄의 영상 값 — 원본 키 · 길이(초) · 표지 지점(초) */
export type VisitVideo = { key: string; duration: number; posterAt: number };

/** 그 줄이 영상이면 영상 값, 사진이면 null — 세 값은 함께 있거나 함께 없다(0089) */
export function visitVideoOf(p: VisitPhoto): VisitVideo | null {
  if (p.video_key === null || p.duration === null || p.poster_at === null) return null;
  return { key: p.video_key, duration: p.duration, posterAt: p.poster_at };
}

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
