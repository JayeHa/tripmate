import {
  isHttpUrl,
  type NewItemFields,
  type NewPlaceFields,
  type PlaceCategory,
  type ReservationStatus,
} from "@/entities/schedule-item";

/** 링크 한 줄(입력 중) */
export type LinkDraft = { title: string; url: string };

export type LatLng = { lat: number; lng: number };

/** 장소 입력 폼의 값. 입력 칸이 다루는 문자열 그대로 들고, 저장할 때 toPlaceSchedule 로 바꾼다 */
export type PlaceFormValues = {
  emoji: string;
  name: string;
  category: PlaceCategory;
  /** 지도 중앙 핀 위치. 처음엔 도시 중심 */
  at: LatLng | null;
  /** 위치 검색으로 고른 구글 장소(지도를 움직이면 지운다 — 고른 곳과 핀이 달라져서) */
  google: { id: string; address: string | null } | null;
  hours: string;
  rating: string;
  reviews: string;
  wait: string;
  description: string;
  gmap: string;
  links: LinkDraft[];
  status: ReservationStatus | null;
  time: string;
  planLinks: LinkDraft[];
  memo: string;
};

/** 새 폼. 이름은 일정 추가 화면의 검색어, 핀은 도시 중심에서 시작한다 */
export function blankPlaceForm(name: string, center: LatLng | null): PlaceFormValues {
  return {
    emoji: "",
    name,
    category: "sight",
    at: center,
    google: null,
    hours: "",
    rating: "",
    reviews: "",
    wait: "",
    description: "",
    gmap: "",
    links: [],
    status: null,
    time: "",
    planLinks: [],
    memo: "",
  };
}

/**
 * 두 좌표가 같은 지점인지. 지도 중심은 부동소수 오차가 있어 1e-6°(약 10cm) 안이면 같다고 본다.
 * 지도 이동이 코드가 옮긴 것(검색으로 고름)인지 사용자가 옮긴 것인지 가를 때 쓴다.
 */
export function samePoint(a: LatLng, b: LatLng): boolean {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
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

type Saved = { place: NewPlaceFields; item: NewItemFields };
export type PlaceFormResult = { ok: true; value: Saved } | { ok: false; error: string };

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
  if (!v.name.trim()) return "장소 이름을 입력해 주세요";
  const gmap = v.gmap.trim();
  if (gmap && !isHttpUrl(gmap)) return "구글맵 링크는 https:// 로 시작해야 해요";
  if (v.time && !/^\d{2}:\d{2}$/.test(v.time)) return "방문 시간을 확인해 주세요";
  return null;
}

/**
 * 폼 값을 저장할 모양으로(0017 create_place_schedule). 사용자가 고칠 수 있는 문제면 첫 오류 문구를 돌려준다.
 * 칸 범위(카테고리 · 상태 · 대기 길이)는 DB 제약이 다시 지킨다 — 여기서는 입력 중 알 수 있는 것만 본다.
 */
export function toPlaceSchedule(v: PlaceFormValues): PlaceFormResult {
  const problem = problemOf(v);
  if (problem) return { ok: false, error: problem };
  const links = linksOf(v.links, "장소 링크");
  if (typeof links === "string") return { ok: false, error: links };
  const planLinks = linksOf(v.planLinks, "일정 링크");
  if (typeof planLinks === "string") return { ok: false, error: planLinks };
  return {
    ok: true,
    value: {
      place: {
        name: v.name.trim().slice(0, 100),
        emoji: orNull(v.emoji),
        category: v.category,
        lat: v.at?.lat ?? null,
        lng: v.at?.lng ?? null,
        address: v.google?.address ?? null,
        google_place_id: v.google?.id ?? null,
        hours: orNull(v.hours),
        rating: numberOf(v.rating, 1),
        review_count: numberOf(v.reviews),
        wait: orNull(v.wait),
        description: orNull(v.description),
        gmap_url: orNull(v.gmap),
        links,
      },
      item: {
        status: v.status,
        start_time: v.time || null,
        memo: orNull(v.memo),
        links: planLinks,
      },
    },
  };
}
