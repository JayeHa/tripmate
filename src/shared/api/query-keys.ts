export const queryKeys = {
  user: ["user"] as const,
  myProfile: ["user", "profile"] as const,
  /** 도시 기준 데이터(권역 + 도시). 마이그레이션으로만 바뀐다. */
  cities: ["cities"] as const,
  trips: {
    all: ["trips"] as const,
    detail: (tripId: string) => ["trips", tripId] as const,
    members: (tripId: string) => ["trips", tripId, "members"] as const,
  },
  scheduleItems: (tripId: string) => ["trips", tripId, "schedule-items"] as const,
  /** 여행이 고른 도시(순서대로, 좌표 포함) */
  tripCities: (tripId: string) => ["trips", tripId, "cities"] as const,
  /** 「일정 추가」의 저장한 장소 — 이 여행 도시의 내 장소 */
  savedPlaces: (tripId: string) => ["trips", tripId, "saved-places"] as const,
  /** 장소 쌍 사이의 이동 방법 (0011 moves) */
  moves: (tripId: string) => ["trips", tripId, "moves"] as const,
  expenses: (tripId: string) => ["trips", tripId, "expenses"] as const,
  /** 한 여행의 모든 날짜·이동수단 경로. 일정이 바뀌면 이 prefix 로 한꺼번에 무효화한다. */
  dayRoutes: (tripId: string) => ["trips", tripId, "route"] as const,
  dayRoute: (tripId: string, dayIndex: number, mode: string) =>
    ["trips", tripId, "route", dayIndex, mode] as const,
};

/**
 * 영속화 대상 판별. 여행 데이터와 도시 기준 데이터만 남기고 경로는 제외한다.
 * 경로는 Google Routes API 응답 캐시라 서버의 day_routes 테이블이 이미 들고 있다.
 * 도시는 오프라인에서도 도시 이름·지도 중심을 그리려고 남긴다.
 */
export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  if (queryKey[0] === "cities") return true;
  return queryKey[0] === "trips" && queryKey[2] !== "route";
}

/** TanStack Query 캐시를 IndexedDB 에 저장할 때 쓰는 키. */
export const QUERY_PERSIST_KEY = "tripmate-query-cache";

/**
 * 저장된 캐시의 데이터 모양 버전. 값이 다르면 복원하지 않고 버린다.
 *
 * 앞부분은 손으로 올리는 버전, 뒷부분은 빌드할 때 계산한 해시다(query-cache.config.mjs).
 * 해시는 DB 타입과 엔티티 api·model 파일이 바뀌면 저절로 바뀌므로 보통은 손댈 일이 없다.
 * 그 파일들 밖에서 저장 데이터의 모양을 바꿨을 때만 앞부분을 올린다.
 */
export const QUERY_CACHE_BUSTER = `2-${process.env.QUERY_CACHE_HASH ?? "dev"}`;
