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
 * 끝난 세션의 토큰을 다시 쓰면 그 세션이 무효가 되어 요청 전부가 토큰 없이 과금된다(구글 문서).
 * 그래서 같은 결과 목록에서 두 번째로 고를 때는 토큰 없이 장소 id 로 상세를 조회한다(docs/policies/place-search.md).
 */
export function usePlaceSuggestions(query: string, city: City | null) {
  const places = useMapsLibrary("places");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // 지금 보이는 결과를 받은 세션이 아직 안 끝났는지. 끝났으면(한 곳을 이미 골랐으면) 그 결과의 토큰을 다시 쓰지 않는다
  const resultsLive = useRef(false);
  const input = query.trim();

  useEffect(() => {
    if (!places || !input) return;
    // 아래 함수 안에서도 null 이 아님을 유지하려고 지역 상수로 잡는다
    const lib = places;
    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);
      // 이 요청이 쓰는 토큰. 응답을 기다리는 사이 고르기로 세션이 끝나면 sessionRef 가 바뀐다
      const token = (sessionRef.current ??= new lib.AutocompleteSessionToken());
      try {
        const res = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: token,
          language: "ko",
          ...(city ? searchArea(city) : {}),
        });
        if (!cancelled) {
          setSuggestions(res.suggestions);
          // 세션이 그대로일 때만 살아 있는 목록이다. 이미 끝났으면 보여 주되 고를 때 토큰 없이 조회한다
          resultsLive.current = sessionRef.current === token;
        }
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
    if (!prediction || !places) return null;
    // 첫 고르기는 세션 토큰이 붙은 toPlace 로(세션을 끝낸다), 그다음은 토큰 없는 새 Place 로
    const place = resultsLive.current
      ? prediction.toPlace()
      : new places.Place({ id: prediction.placeId });
    resultsLive.current = false;
    sessionRef.current = null;
    await place.fetchFields({ fields: ["id", "displayName", "location", "formattedAddress"] });
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
