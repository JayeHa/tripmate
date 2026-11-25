import type { MemoPhoto } from "@/entities/schedule-item";

/**
 * 메모 창의 사진 하나 — 저장된 것(키)이거나 방금 고른 것(파일 + 기기 안 미리보기 주소).
 * id 는 목록의 key · 지우기에 쓴다(저장된 것은 사진 키)
 */
export type DraftMemoPhoto =
  | { id: string; saved: MemoPhoto; file: null; preview: null }
  | { id: string; saved: null; file: File; preview: string };

/** 저장된 사진 → 창의 사진 */
export function draftPhotosOf(photos: readonly MemoPhoto[]): DraftMemoPhoto[] {
  return photos.map((p) => ({ id: p.photo_key, saved: p, file: null, preview: null }));
}

/** 사진이 연 때와 달라졌나 — 새로 고른 것이 있거나, 저장된 것을 빼거나 순서를 바꿨다 */
export function photosChanged(
  initial: readonly DraftMemoPhoto[],
  draft: readonly DraftMemoPhoto[],
): boolean {
  if (draft.length !== initial.length) return true;
  return draft.some((p, i) => p.saved?.photo_key !== initial[i].saved?.photo_key);
}

/** 저장 전에 있던 사진 중 저장 뒤에 없는 것의 파일 키(사진 · 썸네일) — 저장한 다음 지운다 */
export function droppedKeys(before: readonly MemoPhoto[], after: readonly MemoPhoto[]): string[] {
  const kept = new Set(after.map((p) => p.photo_key));
  return before.filter((p) => !kept.has(p.photo_key)).flatMap((p) => [p.photo_key, p.thumb_key]);
}

/** 사진 키 둘을 모두 — 메모를 지운 뒤 파일을 지울 때 */
export function photoFileKeys(photos: readonly MemoPhoto[]): string[] {
  return photos.flatMap((p) => [p.photo_key, p.thumb_key]);
}
