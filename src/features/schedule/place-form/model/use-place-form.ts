"use client";

import { useCallback, useRef, useState } from "react";

import {
  addPlaceErrorMessage,
  useAddPlacesToSchedule,
  useCreatePlaceSchedule,
} from "@/entities/schedule-item";
import {
  localLanguage,
  type SearchCity,
  useAddressSearch,
  usePlaceSuggestions,
  useReverseGeocode,
} from "@/shared/lib/google-places";

import {
  blankPlaceForm,
  type LatLng,
  normalizeRating,
  normalizeReviews,
  type PlaceFormValues,
  toNewPlace,
  withGooglePick,
  withoutGooglePick,
} from "../lib/place-form";
import { useExistingPlace } from "./use-existing-place";

/** ① 위치 선택 → ② 장소 정보 */
export type PlaceFormStep = "location" | "info";

type PlaceFormOptions = {
  tripId: string;
  dayIndex: number;
  /** 검색 범위 · 처음 지도 중심 · 현지어 주소 언어를 정하는 도시. 없으면 제한 없이 찾고, 위치를 고르기 전엔 지도도 없다 */
  city: SearchCity | null;
  /** 위치 검색칸의 처음 값(일정 추가 화면의 검색어) */
  initialQuery: string;
  /** 담기에 성공하면 부른다 */
  onSaved: () => void;
};

/**
 * 장소 입력 폼(일정 모드)의 상태와 동작. 열릴 때마다 새로 마운트돼 처음 값에서 시작한다.
 * ① 위치 선택: 위치 검색으로 고르거나(구글 장소, 같은 도시 제한) 지도를 끌어 중앙 핀을 맞춘다. 핀 위치의 주소를 불러와야
 *    (또는 불러오지 못했으면) 다음으로 간다. 지도를 끌면 고른 구글 장소는 지운다(핀과 장소가 달라지므로)
 * ② 장소 정보: 이름(고른 장소 이름으로 채움) · 카테고리 · 운영시간 … 을 적고 「day N에 담기」
 */
export function usePlaceForm({ tripId, dayIndex, city, initialQuery, onSaved }: PlaceFormOptions) {
  // 위치는 비운 채 시작한다 — 고르거나 지도를 끌어야 정해진다. 지도는 그동안 도시 중심을 보인다(mapCenter)
  const [values, setValues] = useState<PlaceFormValues>(() => blankPlaceForm(null));
  const [step, setStep] = useState<PlaceFormStep>("location");
  const [locationQuery, setLocationQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);
  const same = useExistingPlace(tripId);
  const suggestions = usePlaceSuggestions(locationQuery, city);
  const addressHit = useAddressSearch(locationQuery, city);
  const found = useReverseGeocode(values.at, city ? localLanguage(city.country_code) : null);
  const create = useCreatePlaceSchedule(tripId);
  const attach = useAddPlacesToSchedule(tripId);
  const savingRef = useRef(false);

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

  /** 이미 있는 장소를 그대로 그날 끝에 담는다(새 장소를 만들지 않는다) */
  function attachExisting() {
    if (!same.existing || savingRef.current) return;
    savingRef.current = true;
    void attach
      .mutateAsync({ dayIndex, entries: [{ place_id: same.existing.id }] })
      .then(onSaved, () => undefined)
      .finally(() => {
        savingRef.current = false;
      });
  }

  /** 이미 있는 장소 대신 새로 등록 — 구글 장소 연결을 끊고 ① 에 머문다(「이 위치로 선택」 → ②). 앞선 담기 실패 문구는 지운다 */
  function registerNew() {
    attach.reset();
    same.clear();
    setValues(withoutGooglePick);
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

  /** 검증을 통과하면 장소를 만들어(이미 가진 구글 장소면 그것) 그날 끝에 담는다. 담는 동안 다시 누르지 못한다 */
  function save() {
    if (savingRef.current) return;
    const result = toNewPlace(values, found);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    savingRef.current = true;
    // mutate 의 호출 단위 콜백은 저장 중에 창이 닫혀(언마운트) 버리면 실행되지 않는다 — 오프라인으로 멈춘 동안은 닫을 수 있다.
    // mutateAsync 의 Promise 는 언마운트와 관계없이 끝나므로 여기서 완료를 알린다. 실패 문구는 create.error 가 보인다
    void create
      .mutateAsync({ dayIndex, place: result.value, emoji: values.emoji.trim() || null })
      .then(onSaved, () => undefined)
      .finally(() => {
        savingRef.current = false;
      });
  }

  return {
    values,
    set,
    setRating: (input: string) => set("rating", normalizeRating(input)),
    setReviews: (input: string) => set("reviews", normalizeReviews(input)),
    step,
    /** ① 에서 다음으로: 핀이 있고, 주소 · 이미 있는 장소 확인을 기다리는 중이 아닐 때(주소는 못 불러왔어도 된다) */
    canChooseLocation: !!values.at && !found.busy && !same.checking,
    chooseLocation: () => setStep("info"),
    /** ② 「위치 변경」 · 뒤로 */
    changeLocation: () => setStep("location"),
    locationQuery,
    setLocationQuery,
    suggestions,
    pickLocation,
    existing: same.existing,
    attachExisting,
    registerNew,
    addressHit,
    moveToAddress,
    moveTo,
    found,
    /** 지도 중심: 정한 위치, 아직 없으면 도시 중심. 도시도 없으면 null(검색으로 고르기 전엔 지도가 없다) */
    mapCenter: values.at ?? (city ? { lat: city.lat, lng: city.lng } : null),
    save,
    saving: create.isPending || attach.isPending,
    /** 저장 요청이 서버에 가 있는 동안은 창을 닫지 못한다. 오프라인으로 멈춘(paused) 동안은 닫을 수 있다 */
    locked: (create.isPending && !create.isPaused) || (attach.isPending && !attach.isPaused),
    canSave: !!values.at && values.name.trim().length > 0,
    error: error ?? errorOf(create.error ?? attach.error),
  };
}

/** 담기 실패 문구. 오류가 없으면 null */
function errorOf(e: unknown): string | null {
  return e ? addPlaceErrorMessage(e) : null;
}

export type PlaceFormState = ReturnType<typeof usePlaceForm>;
