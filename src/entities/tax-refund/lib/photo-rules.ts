import type { TaxRefundPhoto } from "../model/types";

/** 사진으로 받는 종류 — 화면에서 줄인 뒤의 결과. 버킷 `allowed_mime_types` 와 같다(0080) */
export const REFUND_PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

/** 한 장 최대 크기(5MB) — 버킷 `file_size_limit` 와 같다(0080) */
export const REFUND_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** 기록 하나의 최대 장수 — 트리거 `tax_refund_photos_guard` 와 같다(0080) */
export const REFUND_PHOTO_LIMIT = 6;

/** 줄일 때 긴 변(px) — 영수증 글씨 · QR · 바코드가 읽히는 정도 */
export const REFUND_PHOTO_SIDE = 1600;

/** 썸네일 긴 변(px) — 상세의 64 칸을 3배 화면에서도 또렷하게 */
export const REFUND_THUMB_SIDE = 192;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 받는 종류인가 */
export function isRefundPhotoMime(mime: string): boolean {
  return (REFUND_PHOTO_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{여행 id}/{uuid}.{확장자}`. 첫 칸이 여행이라 버킷 정책 · 서버가 경로로 멤버를 가린다 */
export function refundPhotoKey(tripId: string, id: string, mime: string): string {
  return `${tripId}/${id}.${EXT[mime] ?? "jpg"}`;
}

/** 키가 모두 그 여행 폴더 안인가 — 다른 여행 파일의 주소를 받지 못하게. DB 의 keys_in_trip 과 같은 규칙 */
export function refundPhotoKeysInTrip(tripId: string, keys: string[]): boolean {
  return keys.every((k) => k.startsWith(`${tripId}/`) && !k.includes(".."));
}

/** 사진 종류 — 이 순서로 「+ 영수증」 · 「+ 물품」 · 「+ 캡처」 버튼과 상세의 사진이 놓인다 */
export const REFUND_PHOTO_KINDS = ["receipt", "item", "capture"] as const;
export type RefundPhotoKind = (typeof REFUND_PHOTO_KINDS)[number];

export const REFUND_PHOTO_KIND_LABEL: Record<RefundPhotoKind, string> = {
  receipt: "영수증",
  item: "물품",
  capture: "캡처",
};

/** 저장된 종류 → 이름. 모르는 값이면 「사진」 */
export function photoKindLabel(kind: string): string {
  return REFUND_PHOTO_KIND_LABEL[kind as RefundPhotoKind] ?? "사진";
}

/** 기록 하나의 사진 — 종류 순(영수증 → 물품 → 캡처), 같은 종류는 올린 순 */
export function photosOf(photos: readonly TaxRefundPhoto[], refundId: string): TaxRefundPhoto[] {
  const rank = (k: string) => {
    const i = REFUND_PHOTO_KINDS.indexOf(k as RefundPhotoKind);
    return i < 0 ? REFUND_PHOTO_KINDS.length : i;
  };
  return photos
    .filter((p) => p.refund_id === refundId)
    .toSorted((a, b) => rank(a.kind) - rank(b.kind) || a.created_at.localeCompare(b.created_at));
}
