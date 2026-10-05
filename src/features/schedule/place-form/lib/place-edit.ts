import {
  type Place,
  PLACE_CATEGORIES,
  type PlaceCategory,
  placeLinksOf,
  WEEK_DAYS,
  weekHoursOf,
} from "@/entities/schedule-item";
import type { TablesUpdate } from "@/shared/api/supabase/database.types";

import { isPickedMapsUrl } from "./google-autofill";
import {
  blankPlaceForm,
  type FoundAddress,
  normalizeReviews,
  type PlaceFormValues,
  toNewPlace,
} from "./place-form";

/** DB 의 카테고리 문자열을 폼 값으로. 모르는 값이면 null */
function categoryOf(value: string | null): PlaceCategory | null {
  return PLACE_CATEGORIES.find((c) => c === value) ?? null;
}

/**
 * 저장된 장소를 장소 입력 폼 값으로 — 「장소 정보 수정」 의 처음 값.
 * 요일별 운영시간이 하나라도 있으면 요일별(안 적힌 요일은 빈칸), 아니면 매일 같음.
 * 아이콘은 일정 칸이라 비운다(수정 모드는 아이콘 칸을 보이지 않는다).
 * 구글맵 링크가 그 장소의 구글 id 로 만든 링크면 자동으로 채운 값(auto.gmap)으로 둔다 — 핀을 옮기거나 다른 곳을 고르면
 * 새로 담을 때처럼 지우거나 바꿔서, 옛 장소를 가리키는 링크가 남지 않게
 */
export function placeFormOf(place: Place): PlaceFormValues {
  const week = weekHoursOf(place.hours_week);
  const blank = blankPlaceForm(
    place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : null,
  );
  return {
    ...blank,
    auto: {
      ...blank.auto,
      gmap: isPickedMapsUrl(place.gmap_url, place.google_place_id) ? place.gmap_url : "",
    },
    name: place.name,
    category: categoryOf(place.category),
    googleId: place.google_place_id,
    addressDetail: place.address_detail ?? "",
    hoursMode: week ? "week" : "same",
    hours: week ? "" : (place.hours ?? ""),
    hoursWeek: week
      ? (Object.fromEntries(
          WEEK_DAYS.map((d) => [d, d in week ? (week[d] ?? null) : ""]),
        ) as PlaceFormValues["hoursWeek"])
      : blank.hoursWeek,
    rating: place.rating === null ? "" : String(place.rating),
    reviews: place.review_count === null ? "" : normalizeReviews(String(place.review_count)),
    wait: place.wait ?? "",
    description: place.description ?? "",
    gmap: place.gmap_url ?? "",
    links: placeLinksOf({ place }).map((l) => ({ ...l })),
  };
}

/** 저장된 주소 세 줄 — 위치를 옮기지 않았으면 다시 불러오지 않고 이것을 쓴다 */
export function storedAddressOf(place: Place): FoundAddress {
  return {
    address: place.address,
    addressLocal: place.address_local,
    addressKo: place.address_ko,
  };
}

export type PlacePatchResult =
  { ok: true; patch: TablesUpdate<"places"> } | { ok: false; error: string };

/**
 * 고친 폼 값을 장소 patch 로 — 「장소 정보 수정」 을 연 때(initial)와 **달라진 칸만**.
 * 그사이 다른 화면에서 바꾼 칸을 손대지 않은 칸으로 덮지 않게 한다. 바뀐 칸이 없으면 빈 patch.
 * 검증은 새로 담을 때와 같다(toNewPlace). 다만 다시 담기와 달리 빈 칸은 「기존 값 유지」 가 아니라 지우기다
 */
export function toPlacePatch(
  v: PlaceFormValues,
  found: FoundAddress,
  initial: PlaceFormValues,
  initialFound: FoundAddress,
): PlacePatchResult {
  const next = toNewPlace(v, found);
  if (!next.ok) return next;
  const base = toNewPlace(initial, initialFound);
  const before: Record<string, unknown> = base.ok ? base.value : {};
  const patch = Object.fromEntries(
    Object.entries(next.value).filter(
      ([k, val]) => JSON.stringify(val) !== JSON.stringify(before[k]),
    ),
  );
  return { ok: true, patch };
}

/**
 * 장소 정보 수정 실패 문구. 다시 해도 안 되는 실패는 이유를, 그 밖(네트워크 · 서버)은 다시 시도를 안내한다.
 * supabase-js 오류는 Error 인스턴스가 아닌 `{ message, code }` 객체라 message 문자열이 있으면 무엇이든 읽는다
 */
export function placeEditErrorMessage(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";
  // places_owner_google_key — 위치 검색으로 고른 구글 장소를 내가 이미 다른 장소로 갖고 있다
  if (message.includes("duplicate key")) {
    return "고른 곳이 이미 다른 장소로 저장돼 있어요. 위치를 다시 골라 주세요.";
  }
  // updatePlace 가 0행이면 내는 문구(남의 장소)
  if (message.includes("만든 사람만")) return message;
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
