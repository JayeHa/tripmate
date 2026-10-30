export const queryKeys = {
  user: ["user"] as const,
  myProfile: ["user", "profile"] as const,
  /** 도시 기준 데이터(권역 + 도시). 마이그레이션으로만 바뀐다. */
  cities: ["cities"] as const,
  /** 도시별 지역 목록(0070). 마이그레이션으로만 바뀐다 */
  cityAreas: ["city-areas"] as const,
  /** 실시간 환율(참고용, 하루 한 번 갱신) — 기준 통화마다 */
  liveRates: (base: string) => ["live-rates", base] as const,
  /** 여행지 국가의 공휴일 — 나라 · 해마다. 배포 사이에는 바뀌지 않는다 */
  holidays: (country: string, year: number) => ["holidays", country, year] as const,
  /** 날씨(Open-Meteo) — 도시마다 앞으로 16일 예보, 도시 · 달마다 평년 기온 */
  weather: {
    forecast: (city: string) => ["weather", "forecast", city] as const,
    normals: (city: string, month: number) => ["weather", "normals", city, month] as const,
  },
  trips: {
    all: ["trips"] as const,
    detail: (tripId: string) => ["trips", tripId] as const,
    members: (tripId: string) => ["trips", tripId, "members"] as const,
  },
  scheduleItems: (tripId: string) => ["trips", tripId, "schedule-items"] as const,
  /** 대체 장소 줄. 일정 키 아래라 일정을 무효화하면 함께 다시 읽는다 */
  alternatives: (tripId: string) => ["trips", tripId, "schedule-items", "alternatives"] as const,
  /**
   * 여행 가이드 보관함(trip_places + 장소). 일정 키 아래에 둔다 — 일정에 장소를 넣으면 DB 가 보관함에도 넣으므로,
   * 일정을 무효화하는 곳(저장 · 실시간 · 장소 수정)이 보관함도 함께 다시 읽게
   */
  guidePlaces: (tripId: string) => ["trips", tripId, "schedule-items", "guide"] as const,
  /** 여행이 고른 도시(순서대로, 좌표 포함) */
  tripCities: (tripId: string) => ["trips", tripId, "cities"] as const,
  /** 「일정 추가」의 저장한 장소 — 이 여행 도시의 내 장소 */
  savedPlaces: (tripId: string) => ["trips", tripId, "saved-places"] as const,
  /** 장소 쌍 사이의 이동 방법 (0011 moves) */
  moves: (tripId: string) => ["trips", tripId, "moves"] as const,
  memos: (tripId: string) => ["trips", tripId, "memos"] as const,
  /** 숙소(장소 포함) — 체크인 순 */
  stays: (tripId: string) => ["trips", tripId, "stays"] as const,
  /** 항공편 — 출발 순 */
  flights: (tripId: string) => ["trips", tripId, "flights"] as const,
  /** 노트 · 체크리스트 */
  checklist: (tripId: string) => ["trips", tripId, "checklist"] as const,
  checklistTargets: (tripId: string) => ["trips", tripId, "checklist-targets"] as const,
  /** 노트 · 바우처. 파일 읽기 주소는 그 아래 "urls" */
  vouchers: (tripId: string) => ["trips", tripId, "vouchers"] as const,
  /** 노트 · 준비물 · 쇼핑 — 그룹과 항목(두 종류 함께) */
  packLists: (tripId: string) => ["trips", tripId, "pack-lists"] as const,
  /** 쇼핑 참고 사진 — 읽기 주소는 그 아래 "urls" */
  packPhotos: (tripId: string) => ["trips", tripId, "pack-photos"] as const,
  expenses: (tripId: string) => ["trips", tripId, "expenses"] as const,
  tripGuests: (tripId: string) => ["trips", tripId, "guests"] as const,
  settlements: (tripId: string) => ["trips", tripId, "settlements"] as const,
  receipts: (tripId: string) => ["trips", tripId, "receipts"] as const,
  /** 한 여행의 모든 날짜·이동수단 경로. 일정이 바뀌면 이 prefix 로 한꺼번에 무효화한다. */
  dayRoutes: (tripId: string) => ["trips", tripId, "route"] as const,
  dayRoute: (tripId: string, dayIndex: number, mode: string) =>
    ["trips", tripId, "route", dayIndex, mode] as const,
};

/**
 * 영속화 대상 판별. 여행 데이터와 도시 기준 데이터만 남기고 경로는 제외한다.
 * 경로는 Google Routes API 응답 캐시라 서버의 day_routes 테이블이 이미 들고 있다.
 * 도시는 오프라인에서도 도시 이름·지도 중심을 그리려고 남긴다. 공휴일 · 날씨도 여행지에서 오프라인으로 보이게 남긴다.
 */
export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  if (["cities", "holidays", "weather"].includes(String(queryKey[0]))) return true;
  // 내 프로필(이름 · 사진) — 오프라인 첫 화면의 계정 버튼이 「?」 로 보이지 않게. 로그인 정보(["user"])는 남기지 않는다
  if (queryKey[0] === "user" && queryKey[1] === "profile") return true;
  // 영수증 · 바우처 · 쇼핑 사진 읽기 주소는 1시간이면 만료돼 저장하지 않는다
  const files = ["receipts", "vouchers", "pack-photos"];
  if (files.includes(String(queryKey[2])) && queryKey[3] === "urls") {
    return false;
  }
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
