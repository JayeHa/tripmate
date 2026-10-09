/** 프로필 사진으로 받는 종류 — 줄인 뒤의 결과. 버킷 `allowed_mime_types` 와 같다(0043) */
export const AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

/** 한 장 최대 크기(2MB) — 버킷 `file_size_limit` 와 같다(0043). 화면에서 긴 변 512 로 줄여 보통 수십 KB 다 */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** 줄일 때 긴 변(px) — 가장 큰 아바타(72)의 고해상도 화면 3배를 넘는다 */
export const AVATAR_SIDE = 512;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 받는 종류인가 */
export function isAvatarMime(mime: string): boolean {
  return (AVATAR_MIMES as readonly string[]).includes(mime);
}

/** 저장소 키 — `{사용자 id}/{uuid}.{확장자}`. 첫 칸이 사용자라 버킷 정책 · 서버가 경로로 주인을 가린다 */
export function avatarKey(userId: string, id: string, mime: string): string {
  return `${userId}/${id}.${EXT[mime] ?? "jpg"}`;
}

/** 키가 그 사용자 폴더 안인가 — 남의 사진을 지우지 못하게 */
export function isOwnAvatarKey(userId: string, key: string): boolean {
  return key.startsWith(`${userId}/`) && !key.includes("..") && key.split("/").length === 2;
}

/**
 * 공개 주소에서 저장소 키를 꺼낸다 — 우리 버킷에 올린 사진이 아니면(구글 사진 · 비어 있음) null.
 * 사진을 바꾸거나 「기본 이미지로」 돌릴 때 앞 사진 파일을 지우는 데 쓴다
 */
export function avatarKeyOf(url: string | null, bucketBase: string): string | null {
  if (!url?.startsWith(bucketBase)) return null;
  return decodeURIComponent(url.slice(bucketBase.length).split("?")[0]);
}
