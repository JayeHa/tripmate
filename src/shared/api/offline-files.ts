/**
 * 기기에 남기는 사진 파일 — 바우처(그림 · 썸네일 · 사진 원본)와 쇼핑 참고 사진.
 * 화면은 서버가 준 서명 주소(1시간)로 보는데, 서비스 워커(`app/sw.ts`)는 그 주소의 token 을 빼고 경로로 저장해 둔다.
 * 오프라인이라 서명 주소를 받지 못하면 경로만 있는 주소를 쓴다 — 저장해 둔 사진이면 서비스 워커가 그것을 준다.
 * 저장소를 R2 로 바꾸면(#18 ⑫-b) 이 주소 모양도 함께 바꾼다
 */
import { ApiError } from "./post-json";

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

/**
 * 서버에 닿지 못한 실패인가 — 네트워크가 끊겼거나(ApiError 0, fetch 가 거부됨) 서버 · 게이트웨이가 응답하지 못했다(503 · 504).
 * 권한(403) · 서버 오류(500)는 아니다 — 그때 저장해 둔 사진을 계속 보여 주면 빠진 멤버가 사진을 보거나 오류가 가려진다
 */
export function isUnreachable(error: unknown): boolean {
  return error instanceof ApiError && [0, 503, 504].includes(error.status);
}

/**
 * 사진 주소 쿼리에 오프라인 주소를 끼운다 — 서버에 닿지 못했고(재시도가 멈춘 동안의 failureReason 도 본다) 지금 키의 주소가 없을 때만.
 * 앞 키 묶음의 주소를 잠깐 보여 주는 중(placeholder)이면 새 키가 빠져 있어 오프라인 주소로 바꾼다
 */
export function withOfflineFileUrls<
  Q extends { data?: Record<string, string>; isPlaceholderData: boolean; failureReason: unknown },
>(query: Q, bucket: OfflineBucket, keys: string[]): Q {
  if (!isUnreachable(query.failureReason)) return query;
  if (query.data && !query.isPlaceholderData) return query;
  return { ...query, data: offlineFileUrls(bucket, keys) };
}

/**
 * 「오프라인용으로 받기」 로 받은 여행의 저장 칸(Cache Storage) — 자동 저장 칸(최근 64개 · 7일)과 따로 두어 밀려나거나 먼저 지워지지 않는다.
 * 화면은 배포마다 따로(그 배포의 JS · CSS 를 가리킨다 — `app/sw.ts` 의 BUILD_ID), 사진은 키가 바뀌지 않아 여행마다 하나.
 * 이름의 구분자는 `:` — 여행 id(uuid) 와 빌드 id 에 `-` 가 들어간다
 */
const TRIP_PAGES = "offline-pages";
const TRIP_FILES = "offline-files";

/** 받은 여행의 화면 칸 이름 */
export function tripPagesCacheName(tripId: string, buildId: string): string {
  return `${TRIP_PAGES}:${tripId}:${buildId}`;
}

/** 받은 여행의 사진 칸 이름 */
export function tripFilesCacheName(tripId: string): string {
  return `${TRIP_FILES}:${tripId}`;
}

/** 화면 칸 이름을 나눈다 — 받은 여행의 화면 칸이 아니면 null */
export function parseTripPagesCacheName(name: string): { tripId: string; buildId: string } | null {
  const [kind, tripId, buildId] = name.split(":");
  return kind === TRIP_PAGES && tripId && buildId ? { tripId, buildId } : null;
}

/** 받은 여행의 사진 칸인가 */
export function isTripFilesCacheName(name: string): boolean {
  return name.startsWith(`${TRIP_FILES}:`);
}

/** 페이지가 서비스 워커에 「이 여행용으로 받아 둬」 하고 보내는 메시지 — 화면(같은 출처 주소) 또는 사진(서명 주소) */
export type OfflineSaveRequest = {
  type: "offline-save";
  tripId: string;
  kind: "page" | "file";
  url: string;
};

/** 받은 메시지가 받기 요청인가 */
export function isOfflineSaveRequest(data: unknown): data is OfflineSaveRequest {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Partial<OfflineSaveRequest>;
  return (
    d.type === "offline-save" &&
    typeof d.tripId === "string" &&
    typeof d.url === "string" &&
    (d.kind === "page" || d.kind === "file")
  );
}

/** 받은 여행의 저장 칸(화면 · 사진)을 지운다 — 보관 기간이 지났을 때. 저장소를 못 쓰는 환경이면 넘어간다 */
export async function dropOfflineTrip(tripId: string): Promise<void> {
  try {
    const names = await caches.keys();
    const mine = (n: string) =>
      parseTripPagesCacheName(n)?.tripId === tripId || n === tripFilesCacheName(tripId);
    await Promise.all(names.filter(mine).map((n) => caches.delete(n)));
  } catch {
    // 저장소가 없으면 지울 것도 없다
  }
}
