export const queryKeys = {
  user: ["user"] as const,
  trips: {
    all: ["trips"] as const,
    detail: (tripId: string) => ["trips", tripId] as const,
    members: (tripId: string) => ["trips", tripId, "members"] as const,
  },
  scheduleItems: (tripId: string) => ["trips", tripId, "schedule-items"] as const,
  expenses: (tripId: string) => ["trips", tripId, "expenses"] as const,
  /** 한 여행의 모든 날짜·이동수단 경로. 일정이 바뀌면 이 prefix 로 한꺼번에 무효화한다. */
  dayRoutes: (tripId: string) => ["trips", tripId, "route"] as const,
  dayRoute: (tripId: string, dayIndex: number, mode: string) =>
    ["trips", tripId, "route", dayIndex, mode] as const,
};

/**
 * 영속화 대상 판별. 여행 데이터만 남기고 경로는 제외한다.
 * 경로는 Google Routes API 응답 캐시라 서버의 day_routes 테이블이 이미 들고 있다.
 */
export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "trips" && queryKey[2] !== "route";
}
