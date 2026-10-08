/** 영수증으로 받는 파일 종류 — 사진(JPG · PNG · WebP · HEIC)과 PDF. DB · 버킷의 허용 목록과 같다(0041) */
export const RECEIPT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

/** 장당 최대 크기(10MB) · 한 지출 최대 장수(3장) — DB 와 같다(0041 · 0042) */
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
export const RECEIPT_MAX_COUNT = 3;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

/** 받는 종류인가 */
export function isReceiptMime(mime: string): boolean {
  return (RECEIPT_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{여행 id}/{uuid}.{확장자}`. 첫 칸이 여행이라 버킷 정책 · 서버가 경로로 멤버를 가린다 */
export function receiptKey(tripId: string, id: string, mime: string): string {
  return `${tripId}/${id}.${EXT[mime] ?? "bin"}`;
}

/** 키가 모두 그 여행 폴더 안인가 — 다른 여행 파일의 주소를 받지 못하게 */
export function keysInTrip(tripId: string, keys: string[]): boolean {
  return keys.every((k) => k.startsWith(`${tripId}/`) && !k.includes(".."));
}
