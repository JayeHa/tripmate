/** 사진으로 받는 종류 — 화면에서 줄인 뒤의 결과. 버킷 `allowed_mime_types` 와 같다(0086) */
export const VISIT_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

/** 한 장 최대 크기(5MB) — 버킷 `file_size_limit` 와 같다(0086) */
export const VISIT_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** 일정 하나의 최대 장수(일행이 올린 것까지) — 트리거 `visit_photo_guard` 와 같다(0088) */
export const VISIT_PHOTO_LIMIT = 10;

/** 사진별 설명 최대 글자 수 — DB check 와 같다(0086) */
export const VISIT_CAPTION_MAX = 40;

/** 줄일 때 긴 변(px) — 기록 창 미리보기 · 자세히 보기에서 폭 그대로 그려도 또렷한 정도 */
export const VISIT_PHOTO_SIDE = 1600;

/** 썸네일 긴 변(px) — 카드의 72 칸(PC)을 3배 화면에서도 또렷하게 */
export const VISIT_THUMB_SIDE = 192;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 받는 종류인가 */
export function isVisitPhotoMime(mime: string): boolean {
  return (VISIT_PHOTO_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{여행 id}/{uuid}.{확장자}`. 첫 칸이 여행이라 버킷 정책 · 서버가 경로로 멤버를 가린다 */
export function visitPhotoKey(tripId: string, id: string, mime: string): string {
  return `${tripId}/${id}.${EXT[mime] ?? "jpg"}`;
}

/** 키가 모두 그 여행 폴더 안인가 — 다른 여행 파일의 주소를 받지 못하게. DB 의 keys_in_trip 과 같은 규칙 */
export function visitPhotoKeysInTrip(tripId: string, keys: string[]): boolean {
  return keys.every((k) => k.startsWith(`${tripId}/`) && !k.includes(".."));
}

/** 저장할 설명 — 앞뒤 공백을 떼고, 비면 null(설명 없음) */
export function cleanCaption(text: string): string | null {
  return text.trim() || null;
}
