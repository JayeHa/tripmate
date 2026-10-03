/**
 * 캐시 주인이 바뀌었는지 판단한다.
 *
 * 쿼리 키에 user id 가 없고 여행 캐시는 IndexedDB 에 7일 남는다. 그래서 사람이
 * 바뀌면 앞사람 데이터가 새 계정 목록에 되살아난다. 둘러보기(익명)에서 Google 로
 * 갈아탈 때가 그 경우다.
 *
 * signInWithOAuth 는 SIGNED_OUT 없이 세션만 교체하고, 전체 페이지 이동이라
 * 메모리 변수로는 비교할 수 없다. 그래서 주인을 저장소에 적어 둔다.
 */
export type CacheOwnerDecision = "drop" | "keep";

export function decideCacheOwner(
  storedOwner: string | null,
  currentUserId: string,
): CacheOwnerDecision {
  if (!storedOwner) return "keep";
  return storedOwner === currentUserId ? "keep" : "drop";
}
