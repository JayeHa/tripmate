import { isHttpUrl, type NewPlaceFields, type PlaceCategory } from "@/entities/schedule-item";

/** 링크 한 줄(입력 중) */
export type LinkDraft = { title: string; url: string };

export type LatLng = { lat: number; lng: number };

/**
 * 장소 입력 폼의 값. 입력 칸이 다루는 문자열 그대로 들고, 저장할 때 toNewPlace 로 바꾼다.
 * 장소 정보만 받는다 — 이번 일정(예약 상태 · 시간 · 일정 링크 · 메모)은 담은 뒤 일정 상세에서 고친다.
 * 주소는 핀 위치에서 불러오므로(useReverseGeocode) 여기 두지 않고 저장할 때 함께 받는다.
 */
export type PlaceFormValues = {
  emoji: string;
  name: string;
  /** 마지막으로 화면이 채워 준 이름(처음엔 빈 값, 장소를 고르면 그 이름). 이름이 이것과 같으면 사용자가 손대지 않은 것 */
  autoName: string;
  /**
   * 고르지 않으면 null. 이미 가진 구글 장소를 다시 담을 때 기존 카테고리를 기본값으로 덮지 않게 비워 시작한다
   * (create_place_schedule 은 빈 칸을 기존 값으로 둔다). 새 장소면 카테고리 없이 저장된다
   */
  category: PlaceCategory | null;
  /**
   * 저장할 위치(지도 중앙 핀). 처음엔 도시 중심, 검색으로 고르거나 지도를 끌면 바뀐다. 위치는 반드시 정한다.
   * 도시가 없는 여행은 검색으로 고르기 전까지 null 이다
   */
  at: LatLng | null;
  /** 위치 검색으로 고른 구글 장소 id(지도를 끌면 지운다 — 고른 곳과 핀이 달라져서) */
  googleId: string | null;
  /** 상세 위치(선택). 「파르코 본관 8F」 */
  addressDetail: string;
  hours: string;
  rating: string;
  reviews: string;
  wait: string;
  description: string;
  gmap: string;
  links: LinkDraft[];
};

/** 새 폼. 이름은 비어 있고(장소를 고르면 채운다), 위치는 도시 중심에서 시작한다 */
export function blankPlaceForm(center: LatLng | null): PlaceFormValues {
  return {
    emoji: "",
    name: "",
    autoName: "",
    category: null,
    at: center,
    googleId: null,
    addressDetail: "",
    hours: "",
    rating: "",
    reviews: "",
    wait: "",
    description: "",
    gmap: "",
    links: [],
  };
}

/**
 * 두 좌표가 같은 지점인지. 지도 중심은 부동소수 오차가 있어 1e-6°(약 10cm) 안이면 같다고 본다.
 * 지도 이동이 코드가 옮긴 것(검색으로 고름)인지 사용자가 옮긴 것인지 가를 때 쓴다.
 */
export function samePoint(a: LatLng, b: LatLng): boolean {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

/**
 * 위치 검색으로 구글 장소를 고른 뒤의 이름. 비었거나 화면이 채운 값(검색어 · 앞서 고른 장소 이름) 그대로면
 * 고른 장소 이름으로 바꾸고, 사용자가 고쳐 쓴 이름은 둔다. 이미 가진 장소를 다시 담으면 이름을 덮어쓰므로
 * (create_place_schedule), 검색어 조각이나 다른 지점 이름이 그 장소를 쓰는 모든 여행의 이름이 되지 않게 한다
 */
export function nameAfterPick(
  v: Pick<PlaceFormValues, "name" | "autoName">,
  picked: string,
): Pick<PlaceFormValues, "name" | "autoName"> {
  const name = v.name.trim();
  if (name && name !== v.autoName.trim()) return v;
  return { name: picked, autoName: picked };
}

/** 별점 입력: 숫자와 점만, 세 글자까지, 5 를 넘으면 5 */
export function normalizeRating(input: string): string {
  const v = input.replace(/[^\d.]/g, "").slice(0, 3);
  return Number.parseFloat(v) > 5 ? "5" : v;
}

/** 리뷰 수 입력: 숫자만 일곱 자리까지, 천 단위 쉼표 */
export function normalizeReviews(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 7);
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

export type PlaceFormResult = { ok: true; value: NewPlaceFields } | { ok: false; error: string };

/** 핀 위치에서 불러온 주소 두 줄(useReverseGeocode). 못 불러왔으면 null */
export type FoundAddress = { address: string | null; addressLocal: string | null };

/** 빈 줄(주소 없음)은 버리고, 주소가 http(s) 가 아니면 그 줄을 짚어 오류 */
function linksOf(drafts: LinkDraft[], label: string): LinkDraft[] | string {
  const filled = drafts
    .map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
    .filter((l) => l.url);
  const bad = filled.find((l) => !isHttpUrl(l.url));
  return bad ? `${label} 주소는 http:// 나 https:// 로 시작해야 해요` : filled;
}

/** 빈 문자열은 null */
const orNull = (v: string) => v.trim() || null;

/** 숫자 칸(별점 · 리뷰 수)을 숫자로. 비었거나 숫자가 아니면 null */
function numberOf(input: string, digits = 0): number | null {
  if (!input) return null;
  const n = Number(input.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const k = 10 ** digits;
  return Math.round(n * k) / k;
}

/** 저장 전에 사용자가 고칠 수 있는 첫 문제. 없으면 null */
function problemOf(v: PlaceFormValues): string | null {
  if (!v.at) return "위치를 정해 주세요";
  if (!v.name.trim()) return "장소 이름을 입력해 주세요";
  const gmap = v.gmap.trim();
  if (gmap && !isHttpUrl(gmap)) return "구글맵 링크는 https:// 로 시작해야 해요";
  return null;
}

/**
 * 폼 값을 저장할 장소 모양으로(create_place_schedule 의 p_place). 사용자가 고칠 수 있는 문제면 첫 오류 문구를 돌려준다.
 * 칸 범위(카테고리 · 대기 길이)는 DB 제약이 다시 지킨다 — 여기서는 입력 중 알 수 있는 것만 본다.
 */
export function toNewPlace(v: PlaceFormValues, found: FoundAddress): PlaceFormResult {
  const problem = problemOf(v);
  if (problem) return { ok: false, error: problem };
  const links = linksOf(v.links, "장소 링크");
  if (typeof links === "string") return { ok: false, error: links };
  return {
    ok: true,
    value: {
      name: v.name.trim().slice(0, 100),
      emoji: orNull(v.emoji),
      category: v.category,
      lat: v.at?.lat ?? null,
      lng: v.at?.lng ?? null,
      address: found.address,
      address_local: found.addressLocal,
      address_detail: orNull(v.addressDetail)?.slice(0, 100) ?? null,
      google_place_id: v.googleId,
      hours: orNull(v.hours),
      rating: numberOf(v.rating, 1),
      review_count: numberOf(v.reviews),
      wait: orNull(v.wait),
      description: orNull(v.description),
      gmap_url: orNull(v.gmap),
      links,
    },
  };
}
