/** 바우처 원본으로 받는 파일 종류 — 사진(JPG · PNG · WebP · HEIC)과 PDF. DB · 버킷의 허용 목록과 같다(0059) */
export const VOUCHER_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

/** 파일당 최대 크기(20MB) — 원본을 줄이지 않아 영수증(10MB)보다 크다. DB · 버킷과 같다(0059) */
export const VOUCHER_MAX_BYTES = 20 * 1024 * 1024;

/** PDF 현장용 페이지를 그림으로 만드는 최대 장수 — DB 의 page_keys 와 같다(0059) */
export const VOUCHER_MAX_PAGES = 5;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

/** 받는 종류인가 */
export function isVoucherMime(mime: string): boolean {
  return (VOUCHER_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{여행 id}/{uuid}.{확장자}`. 첫 칸이 여행이라 버킷 정책 · 서버가 경로로 멤버를 가린다 */
export function voucherKey(tripId: string, id: string, mime: string): string {
  return `${tripId}/${id}.${EXT[mime] ?? "bin"}`;
}

/** 키가 모두 그 여행 폴더 안인가 — 다른 여행 파일의 주소를 받지 못하게. DB 의 keys_in_trip 과 같은 규칙 */
export function voucherKeysInTrip(tripId: string, keys: string[]): boolean {
  return keys.every((k) => k.startsWith(`${tripId}/`) && !k.includes(".."));
}

/** 파일 이름에서 확장자를 뺀 것 — 바로 올리기 · 파일을 고를 때 빈 제목을 채운다 */
export function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .trim()
    .slice(0, 100);
}
