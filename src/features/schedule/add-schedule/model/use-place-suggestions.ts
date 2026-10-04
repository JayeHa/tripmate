"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";

import type { City } from "@/entities/city";
import type { PickedPlaceInput } from "@/entities/schedule-item";

import { searchArea } from "../lib/search-area";

type Suggestion = google.maps.places.AutocompleteSuggestion;

/** 입력이 이만큼 멈추면 찾는다 */
const DEBOUNCE_MS = 250;

/**
 * 구글 장소 자동완성. 고른 도시(`city`)가 있으면 그 나라 · 그 근처 사각형으로 **제한**한다(search-area.ts).
 * 도시가 없는 여행(0006 이전)은 제한 없이 찾는다.
 *
 * 과금: 검색 여러 번 + 고르기(상세 조회) 1번 = 세션 1회. 고르면 세션이 끝나고, 다음 입력부터 새 세션이다.
 * 한 검색에서 여러 곳을 고르면 두 번째부터는 상세 조회가 따로 과금된다(docs/policies/place-search.md).
 */
export function usePlaceSuggestions(query: string, city: City | null) {
  const places = useMapsLibrary("places");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const input = query.trim();

  useEffect(() => {
    if (!places || !input) return;
    sessionRef.current ??= new places.AutocompleteSessionToken();
    // 아래 함수 안에서도 null 이 아님을 유지하려고 지역 상수로 잡는다
    const lib = places;
    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);
      try {
        const res = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionRef.current ?? undefined,
          language: "ko",
          ...(city ? searchArea(city) : {}),
        });
        if (!cancelled) setSuggestions(res.suggestions);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "검색에 실패했어요");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const handle = setTimeout(() => void search(), DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [places, input, city]);

  /**
   * 고른 결과의 이름 · 좌표 · 주소를 받아 담을 모양으로. 이것이 세션을 끝내는 상세 조회다.
   * 실패하면 예외를 그대로 던진다(부른 쪽이 문구를 보인다).
   */
  async function resolve(s: Suggestion): Promise<PickedPlaceInput | null> {
    const prediction = s.placePrediction;
    if (!prediction) return null;
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ["id", "displayName", "location", "formattedAddress"] });
    sessionRef.current = null;
    return {
      name: place.displayName ?? prediction.mainText?.text ?? input,
      google_place_id: place.id || null,
      lat: place.location?.lat() ?? null,
      lng: place.location?.lng() ?? null,
      address: place.formattedAddress ?? null,
    };
  }

  return {
    ready: !!places,
    // 검색어를 지우면 지난 결과를 보이지 않는다
    suggestions: input ? suggestions : [],
    loading: !!input && loading,
    error: input ? error : null,
    resolve,
  };
}
