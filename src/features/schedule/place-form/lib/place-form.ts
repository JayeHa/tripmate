import {
  isHttpUrl,
  type NewPlaceFields,
  type PlaceCategory,
  WEEK_DAYS,
  type WeekDay,
  type WeekHours,
} from "@/entities/schedule-item";
import type { GooglePick } from "@/shared/lib/google-places";

import {
  type Autofill,
  categoryFromGoogle,
  dropPickedLink,
  fillFromPick,
  googleMapsUrl,
} from "./google-autofill";

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
  /**
   * 마지막으로 화면이 채워 준 값(위치 검색으로 구글 장소를 고르면 그 장소의 이름 · 카테고리 · 구글맵 링크).
   * 칸이 이것과 같으면 사용자가 손대지 않은 것이라 다시 고를 때 바꾼다
   */
  auto: Autofill;
  /**
   * 고르지 않으면 null. 이미 가진 구글 장소를 다시 담을 때 기존 카테고리를 기본값으로 덮지 않게 비워 시작한다
   * (create_place_schedule 은 빈 칸을 기존 값으로 둔다). 새 장소면 카테고리 없이 저장된다
   */
  category: PlaceCategory | null;
  /**
   * 저장할 위치(지도 중앙 핀). 처음엔 비어 있고(지도만 도시 중심을 보인다) 검색으로 고르거나 지도를 끌면 정해진다.
   * 위치는 반드시 정한다 — 열자마자 도시 중심(도쿄역)이 그대로 저장되지 않게
   */
  at: LatLng | null;
  /** 위치 검색으로 고른 구글 장소 id(지도를 끌면 지운다 — 고른 곳과 핀이 달라져서) */
  googleId: string | null;
  /** 상세 위치(선택). 「파르코 본관 8F」 */
  addressDetail: string;
  /** 운영시간 입력 방식 — 매일 같음(hours) · 요일별(hoursWeek) */
  hoursMode: "same" | "week";
  hours: string;
  /** 요일별 운영시간. null 이면 휴무, 빈 문자열이면 아직 안 적음 */
  hoursWeek: Record<WeekDay, string | null>;
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
    auto: { name: "", category: null, gmap: "" },
    category: null,
    at: center,
    googleId: null,
    addressDetail: "",
    hoursMode: "same",
    hours: "",
    hoursWeek: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" },
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
 * 위치 검색으로 고른 구글 장소를 폼 값에 반영한다 — 핀(at) · 구글 장소 id · 자동 채움(이름 · 카테고리 · 구글맵 링크).
 * 사용자가 고친 칸은 둔다(fillFromPick)
 */
export function withGooglePick(
  v: PlaceFormValues,
  picked: GooglePick,
  at: LatLng,
): PlaceFormValues {
  const id = picked.google_place_id;
  return {
    ...v,
    ...fillFromPick(v, {
      name: picked.name,
      category: categoryFromGoogle(picked.types),
      gmap: id ? googleMapsUrl(picked.name, id) : "",
    }),
    at,
    googleId: id,
  };
}

/**
 * 고른 구글 장소와의 연결을 끊는다 — 구글 장소 id 와 자동으로 채운 구글맵 링크를 지운다(사용자가 적은 링크 · 이름 · 카테고리는 둔다).
 * 고르기를 시작할 때 먼저 끊고 성공했을 때만 다시 붙여서, 실패 · 낡은 결과 경로가 모두 「연결 없음」으로 끝나게 한다
 */
export function withoutGooglePick(v: PlaceFormValues): PlaceFormValues {
  return { ...v, ...dropPickedLink(v), googleId: null };
}

/** 월요일 칸의 값(시간 · 휴무)을 모든 요일에 적용한다 */
export function mondayToAll(week: PlaceFormValues["hoursWeek"]): PlaceFormValues["hoursWeek"] {
  return Object.fromEntries(WEEK_DAYS.map((d) => [d, week.mon])) as PlaceFormValues["hoursWeek"];
}

/**
 * 저장할 운영시간 칸. 요일별이면 적은 요일 · 휴무만 담은 hours_week(안 적은 요일은 모름)와 빈 hours.
 * 매일 같음이면 hours 와, 시간을 적었을 때만 빈 요일별({} — 이미 있는 장소의 예전 요일별 값을 지운다).
 * 시간을 비워 두면 「모름」이라 요일별도 null(기존 값 유지)
 */
function hoursFields(v: PlaceFormValues): Pick<NewPlaceFields, "hours" | "hours_week"> {
  if (v.hoursMode === "same") {
    const hours = orNull(v.hours);
    return { hours, hours_week: hours ? {} : null };
  }
  const week: WeekHours = {};
  for (const day of WEEK_DAYS) {
    const value = v.hoursWeek[day];
    if (value === null || value.trim()) week[day] = value === null ? null : value.trim();
  }
  // 요일별인데 아무것도 적지 않았으면 「모름」 — 매일 같음의 빈칸처럼 null 로 기존 값을 둔다
  return { hours: null, hours_week: Object.keys(week).length > 0 ? week : null };
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

/** 핀 위치에서 불러온 주소 세 줄(useReverseGeocode — 로마자 · 현지어 · 한글). 못 불러왔으면 null */
export type FoundAddress = {
  address: string | null;
  addressLocal: string | null;
  addressKo: string | null;
};

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
      address_ko: found.addressKo,
      address_detail: orNull(v.addressDetail)?.slice(0, 100) ?? null,
      google_place_id: v.googleId,
      ...hoursFields(v),
      rating: numberOf(v.rating, 1),
      review_count: numberOf(v.reviews),
      wait: orNull(v.wait),
      description: orNull(v.description),
      gmap_url: orNull(v.gmap),
      links,
    },
  };
}
