"use client";

import { useCallback, useRef, useState } from "react";

import { addPlaceErrorMessage, useCreatePlaceSchedule } from "@/entities/schedule-item";
import { type SearchCity, usePlaceSuggestions } from "@/shared/lib/google-places";

import {
  blankPlaceForm,
  normalizeRating,
  normalizeReviews,
  type PlaceFormValues,
  toNewPlace,
} from "../lib/place-form";

type PlaceFormOptions = {
  tripId: string;
  dayIndex: number;
  /** 검색 범위와 처음 지도 중심을 정하는 도시. 없으면 제한 없이 찾고, 위치를 고르기 전엔 지도도 없다 */
  city: SearchCity | null;
  initialName: string;
  /** 담기에 성공하면 부른다 */
  onSaved: () => void;
};

/**
 * 장소 입력 폼(일정 모드)의 상태와 동작. 열릴 때마다 새로 마운트돼 처음 값에서 시작한다.
 * 위치는 두 가지로 정한다 — 위치 검색으로 고르거나(구글 장소, 같은 도시 제한), 지도를 움직여 중앙 핀을 맞춘다.
 * 지도를 움직이면 고른 구글 장소는 지운다(핀과 장소가 달라지므로).
 */
export function usePlaceForm({ tripId, dayIndex, city, initialName, onSaved }: PlaceFormOptions) {
  const [values, setValues] = useState<PlaceFormValues>(() => blankPlaceForm(initialName));
  const [locationQuery, setLocationQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const suggestions = usePlaceSuggestions(locationQuery, city);
  const create = useCreatePlaceSchedule(tripId);
  const savingRef = useRef(false);

  /** 칸 하나를 고친다 */
  function set<K extends keyof PlaceFormValues>(key: K, value: PlaceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** 위치 검색 결과를 고른다. 핀을 그곳으로 옮기고 구글 장소로 기억한다 */
  async function pickLocation(s: google.maps.places.AutocompleteSuggestion) {
    try {
      const picked = await suggestions.resolve(s);
      if (!picked?.lat || !picked.lng) return;
      const at = { lat: picked.lat, lng: picked.lng };
      setValues((v) => ({
        ...v,
        at,
        google: picked.google_place_id
          ? { id: picked.google_place_id, address: picked.address }
          : null,
      }));
      setLocationQuery("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "장소 정보를 가져오지 못했어요");
    }
  }

  /** 사용자가 지도를 끌어 중앙 핀이 옮겨졌다. 지도 리스너가 들고 있으므로 같은 함수를 유지한다 */
  const moveTo = useCallback((at: { lat: number; lng: number }) => {
    setValues((v) => ({ ...v, at, google: null }));
  }, []);

  /** 검증을 통과하면 장소를 만들어(이미 가진 구글 장소면 그것) 그날 끝에 담는다. 담는 동안 다시 누르지 못한다 */
  function save() {
    if (savingRef.current) return;
    const result = toNewPlace(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    savingRef.current = true;
    create.mutate(
      { dayIndex, place: result.value },
      {
        onSuccess: onSaved,
        onSettled: () => {
          savingRef.current = false;
        },
      },
    );
  }

  return {
    values,
    set,
    setRating: (input: string) => set("rating", normalizeRating(input)),
    setReviews: (input: string) => set("reviews", normalizeReviews(input)),
    locationQuery,
    setLocationQuery,
    suggestions,
    pickLocation,
    moveTo,
    /** 지도를 처음 띄울 곳: 고른 위치, 없으면 도시 중심 */
    mapCenter: values.at ?? (city ? { lat: city.lat, lng: city.lng } : null),
    save,
    saving: create.isPending,
    canSave: values.name.trim().length > 0,
    error: error ?? (create.error ? addPlaceErrorMessage(create.error) : null),
  };
}

export type PlaceFormState = ReturnType<typeof usePlaceForm>;
