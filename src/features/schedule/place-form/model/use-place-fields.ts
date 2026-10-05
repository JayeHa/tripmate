"use client";

import { useCallback, useRef, useState } from "react";

import type { Place } from "@/entities/schedule-item";
import {
  localLanguage,
  type SearchCity,
  useAddressSearch,
  usePlaceSuggestions,
  useReverseGeocode,
} from "@/shared/lib/google-places";

import {
  type FoundAddress,
  type LatLng,
  normalizeRating,
  normalizeReviews,
  type PlaceFormValues,
  samePoint,
  withGooglePick,
  withoutGooglePick,
} from "../lib/place-form";
import { useExistingPlace } from "./use-existing-place";

/** ① 위치 선택 → ② 장소 정보 */
export type PlaceFormStep = "location" | "info";

/** 저장돼 있던 위치와 주소. 핀이 이 위치에 있으면 주소를 다시 불러오지 않는다 */
export type StoredLocation = { at: LatLng | null; found: FoundAddress };

type PlaceFieldsOptions = {
  tripId: string;
  /** 검색 범위 · 처음 지도 중심 · 현지어 주소 언어를 정하는 도시. 없으면 제한 없이 찾고, 위치를 고르기 전엔 지도도 없다 */
  city: SearchCity | null;
  initialValues: PlaceFormValues;
  initialStep: PlaceFormStep;
  /** 위치 검색칸의 처음 값 */
  initialQuery: string;
  /** 고친다면 저장돼 있던 위치 · 주소(새로 담으면 null) */
  stored: StoredLocation | null;
  /** 위치 검색으로 고른 곳이 이미 있는 장소인지 찾을지 — 새로 담을 때만 그 장소를 쓸지 묻는다 */
  findExisting: boolean;
};

/**
 * 핀 위치의 주소. 저장돼 있던 위치 그대로면 저장된 주소를 쓴다 — 열 때마다 역지오코딩을 다시 부르지 않고,
 * 손대지 않은 주소가 바뀌지 않게. 저장된 주소가 없으면(예전 데이터) 그 위치의 주소를 불러와 저장할 때 채운다
 */
function usePinAddress(at: LatLng | null, stored: StoredLocation | null, city: SearchCity | null) {
  const keep = !!stored?.at && !!stored.found.address && !!at && samePoint(at, stored.at);
  const geocoded = useReverseGeocode(
    keep ? null : at,
    city ? localLanguage(city.country_code) : null,
  );
  return keep && stored ? { ...stored.found, busy: false, failed: false } : geocoded;
}

/**
 * 장소 입력 폼의 칸과 위치 고르기 — 새로 담기(usePlaceForm) · 장소 정보 수정(usePlaceEditForm)이 함께 쓴다.
 * ① 위치 선택: 위치 검색으로 고르거나(구글 장소, 같은 도시 제한) 지도를 끌어 중앙 핀을 맞춘다. 핀 위치의 주소를 불러와야
 *    (또는 불러오지 못했으면) 다음으로 간다. 지도를 끌면 고른 구글 장소는 지운다(핀과 장소가 달라지므로)
 * ② 장소 정보: 이름(고른 장소 이름으로 채움) · 카테고리 · 운영시간 … 을 적는다. 저장은 부른 쪽이 한다
 */
export function usePlaceFields({
  tripId,
  city,
  initialValues,
  initialStep,
  initialQuery,
  stored,
  findExisting,
}: PlaceFieldsOptions) {
  const [values, setValues] = useState<PlaceFormValues>(initialValues);
  const [step, setStep] = useState<PlaceFormStep>(initialStep);
  const [locationQuery, setLocationQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);
  // ② 에서 「위치 변경」 을 누른 때의 값 — ① 에서 뒤로 가면(cancelLocation) 이 값으로 되돌린다
  const beforeLocationRef = useRef<PlaceFormValues | null>(null);
  const same = useExistingPlace(tripId, findExisting);
  const suggestions = usePlaceSuggestions(locationQuery, city);
  const addressHit = useAddressSearch(locationQuery, city);
  const found = usePinAddress(values.at, stored, city);

  /** 칸 하나를 고친다 */
  function set<K extends keyof PlaceFormValues>(key: K, value: PlaceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** 위치 검색 결과를 고른다. 핀을 그곳으로 옮기고 구글 장소로 기억한다. 이름이 비었거나 자동으로 채운 값이면 그 장소 이름으로 */
  async function pickLocation(s: google.maps.places.AutocompleteSuggestion) {
    // 먼저 끊고 성공했을 때만(apply) 다시 붙인다 — 상세 실패 · 빈 결과 · 좌표 없음 · 낡은 결과가 모두 「연결 없음」으로 끝난다
    setValues(withoutGooglePick);
    setError(null);
    try {
      const result = await same.check(
        () => suggestions.resolve(s),
        (picked) => {
          if (!picked.lat || !picked.lng) return null;
          const at = { lat: picked.lat, lng: picked.lng };
          setValues((v) => withGooglePick(v, picked, at));
          setLocationQuery("");
          return picked.google_place_id;
        },
      );
      if (result === "failed") setValues(withoutGooglePick);
    } catch (e) {
      setError(e instanceof Error ? e.message : "장소 정보를 가져오지 못했어요");
    }
  }

  /** 주소로 찾은 위치로 핀을 옮긴다. 가게가 아니라 지점이라 고른 구글 장소는 지우고 이름은 그대로 둔다 */
  function moveToAddress() {
    if (!addressHit) return;
    setValues((v) => ({
      ...withoutGooglePick(v),
      at: { lat: addressHit.lat, lng: addressHit.lng },
    }));
    same.clear();
    setLocationQuery("");
  }

  /** 사용자가 지도를 끌어 중앙 핀이 옮겨졌다. 지도 리스너가 들고 있으므로 같은 함수를 유지한다 */
  const { clear: clearSame } = same;
  const moveTo = useCallback(
    (at: LatLng) => {
      setValues((v) => ({ ...withoutGooglePick(v), at }));
      clearSame();
    },
    [clearSame],
  );

  return {
    values,
    setValues,
    set,
    setRating: (input: string) => set("rating", normalizeRating(input)),
    setReviews: (input: string) => set("reviews", normalizeReviews(input)),
    step,
    /** ① 에서 다음으로: 핀이 있고, 주소 · 이미 있는 장소 확인을 기다리는 중이 아닐 때(주소는 못 불러왔어도 된다) */
    canChooseLocation: !!values.at && !found.busy && !same.checking,
    chooseLocation: () => setStep("info"),
    /** ② 「위치 변경」 · 뒤로. 지금 값을 기억해 두어 ① 에서 취소할 수 있게 한다 */
    changeLocation: () => {
      beforeLocationRef.current = values;
      setStep("location");
    },
    /**
     * ① 에서 위치 변경을 취소하고 ② 로 — 옮긴 핀 · 고른 구글 장소 · 그로 채운 칸을 「위치 변경」 을 누른 때로 되돌린다.
     * 옮긴 위치를 쓰려면 「이 위치로 선택」(canChooseLocation — 주소를 다 불러온 뒤)을 거쳐야 한다
     */
    cancelLocation: () => {
      if (beforeLocationRef.current) setValues(beforeLocationRef.current);
      same.clear();
      setLocationQuery("");
      setStep("info");
    },
    locationQuery,
    setLocationQuery,
    suggestions,
    pickLocation,
    same,
    addressHit,
    moveToAddress,
    moveTo,
    found,
    /** 지도 중심: 정한 위치, 아직 없으면 도시 중심. 도시도 없으면 null(검색으로 고르기 전엔 지도가 없다) */
    mapCenter: values.at ?? (city ? { lat: city.lat, lng: city.lng } : null),
    /** 이름이 있고 위치를 정했을 때. 고치는 장소가 원래 위치가 없었으면(stored.at null) 위치 없이도 된다 */
    canSave: (!!values.at || (!!stored && !stored.at)) && values.name.trim().length > 0,
    /** 입력 · 검증 오류(저장 요청의 실패 문구는 부른 쪽이 더한다) */
    error,
    setError,
  };
}

export type PlaceFieldsState = ReturnType<typeof usePlaceFields>;

/** 폼 화면이 그리는 상태 — 새로 담기 · 장소 정보 수정 공통. 수정은 이미 있는 장소를 묻지 않아 existing 이 늘 null */
export type PlaceFormState = PlaceFieldsState & {
  existing: Place | null;
  save: () => void;
  saving: boolean;
  locked: boolean;
};
