/**
 * 캐시를 누구 것으로 저장했는지 기록한다.
 *
 * 쿼리 키에 user id 가 없고 여행 캐시는 IndexedDB 에 7일 남는다. 그래서 사람이
 * 바뀌면 앞사람 데이터가 새 계정 목록에 되살아난다. 둘러보기(익명)에서 Google 로
 * 갈아탈 때가 그 경우다.
 *
 * signInWithOAuth 는 SIGNED_OUT 없이 세션만 교체하고 전체 페이지 이동이라,
 * 메모리 변수로는 비교할 수 없다. 그래서 저장소에 적는다.
 */
export const CACHE_OWNER_KEY = "tripmate-cache-owner";

/** 저장소를 못 쓰는 환경(SSR·프라이빗 모드)에서도 죽지 않는다. */
export function readCacheOwner(): string | null {
  try {
    return localStorage.getItem(CACHE_OWNER_KEY);
  } catch {
    return null;
  }
}

export function writeCacheOwner(userId: string | null) {
  try {
    if (userId) localStorage.setItem(CACHE_OWNER_KEY, userId);
    else localStorage.removeItem(CACHE_OWNER_KEY);
  } catch {
    // 저장 못 해도 동작은 이어진다. buster 가 매번 달라져 캐시를 못 쓸 뿐이다.
  }
}
