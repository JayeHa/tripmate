/** 쇼핑 참고 사진으로 받는 종류 — 화면에서 줄인 뒤의 결과. 버킷 `allowed_mime_types` 와 같다(0062) */
export const PACK_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

/** 한 장 최대 크기(5MB) — 버킷 `file_size_limit` 와 같다(0062). 줄인 사진은 보통 수백 KB 다 */
export const PACK_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** 줄일 때 긴 변(px) — 시트(200) · 전체 화면에서 포장 · 글씨가 보이는 정도 */
export const PACK_PHOTO_SIDE = 1600;

/** 목록 썸네일 긴 변(px) — 줄의 48 칸을 3배 화면에서도 또렷하게 */
export const PACK_THUMB_SIDE = 192;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 받는 종류인가 */
export function isPackPhotoMime(mime: string): boolean {
  return (PACK_PHOTO_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{여행 id}/{uuid}.{확장자}`. 첫 칸이 여행이라 버킷 정책 · 서버가 경로로 멤버를 가린다 */
export function packPhotoKey(tripId: string, id: string, mime: string): string {
  return `${tripId}/${id}.${EXT[mime] ?? "jpg"}`;
}

/** 키가 모두 그 여행 폴더 안인가 — 다른 여행 파일의 주소를 받지 못하게. DB 의 keys_in_trip 과 같은 규칙 */
export function packPhotoKeysInTrip(tripId: string, keys: string[]): boolean {
  return keys.every((k) => k.startsWith(`${tripId}/`) && !k.includes(".."));
}

/** 항목의 사진 — 줄인 사진과 목록 썸네일(둘 다 있거나 둘 다 없다, 0062) */
export type PackPhoto = { photo_key: string; thumb_key: string };

/** 항목의 사진 — 칸이 비었으면 null */
export function photoOf(item: {
  photo_key?: string | null;
  thumb_key?: string | null;
}): PackPhoto | null {
  return item.photo_key && item.thumb_key
    ? { photo_key: item.photo_key, thumb_key: item.thumb_key }
    : null;
}
