/**
 * 기기에 남기는 사진 파일 — 바우처(그림 · 썸네일 · 사진 원본)와 쇼핑 참고 사진.
 * 화면은 서버가 준 서명 주소(1시간)로 보는데, 서비스 워커(`app/sw.ts`)는 그 주소의 token 을 빼고 경로로 저장해 둔다.
 * 오프라인이라 서명 주소를 받지 못하면 경로만 있는 주소를 쓴다 — 저장해 둔 사진이면 서비스 워커가 그것을 준다.
 * 저장소를 R2 로 바꾸면(#18 ⑫-b) 이 주소 모양도 함께 바꾼다
 */
const OFFLINE_BUCKETS = ["vouchers", "pack-photos"] as const;
type OfflineBucket = (typeof OFFLINE_BUCKETS)[number];

const SIGN_PATH = "/storage/v1/object/sign/";

/** 서비스 워커가 저장할 사진 주소인가 — 우리 Supabase 저장소의 두 버킷 서명 주소 */
export function isOfflineFileUrl(url: URL): boolean {
  if (!url.hostname.endsWith(".supabase.co") || !url.pathname.startsWith(SIGN_PATH)) return false;
  const bucket = url.pathname.slice(SIGN_PATH.length).split("/")[0];
  return (OFFLINE_BUCKETS as readonly string[]).includes(bucket);
}

/** 저장 키 — 주소에서 token 을 뺀 것 */
export function offlineFileCacheKey(url: string): string {
  return url.split("?")[0];
}

/** 서명 주소를 받지 못했을 때(오프라인) 쓸 주소 — 키마다 token 없는 경로 */
export function offlineFileUrls(bucket: OfflineBucket, keys: string[]): Record<string, string> {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}${SIGN_PATH}${bucket}/`;
  return Object.fromEntries(
    keys.map((k) => [k, base + k.split("/").map(encodeURIComponent).join("/")]),
  );
}
