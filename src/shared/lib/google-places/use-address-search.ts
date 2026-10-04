"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

import { cleanAddress } from "./address";
import { searchArea, type SearchCity, withinSearchArea } from "./search-area";

/** 주소로 찾은 위치 한 곳 */
export type AddressHit = { label: string; lat: number; lng: number };

/** 입력이 이만큼 멈추면 찾는다. 장소 자동완성(250ms)보다 길게 — 주소는 다 적은 뒤에 찾는 경우가 많고, 호출마다 과금된다 */
const DEBOUNCE_MS = 500;

/**
 * 지오코딩을 이 도시 쪽으로 맞추는 조건. 나라로 제한하고, 그 나라 기준으로 읽고(region — 「1-22-7」 을 일본식 번지로),
 * 사각형이 있으면 그 안을 먼저 본다(bounds). region · bounds 가 없으면 한국어 주소가 동네 단위로만 잡힌다
 */
function geocodeArea(city: SearchCity): Partial<google.maps.GeocoderRequest> {
  const area = searchArea(city);
  return {
    componentRestrictions: { country: city.country_code },
    region: city.country_code.toLowerCase(),
    ...("locationRestriction" in area && { bounds: area.locationRestriction }),
  };
}

/**
 * 주소 · 지역 이름으로 위치 찾기(지오코딩). 장소 자동완성은 가게(POI)를 먼저 주고, 일본 주소를 한국어로 적으면
 * (「시부야구 진난 1-22-7」) 그 번지를 거의 주지 않아서 따로 묻는다. 도시가 있으면 그 나라로 제한하고 검색 범위 밖 결과는 버린다.
 * 첫 결과 하나만 돌려준다 — 주소는 보통 한 곳을 가리킨다. 입력마다(멈출 때) 1회 과금(docs/policies/place-search.md).
 *
 * @see https://developers.google.com/maps/documentation/javascript/geocoding
 */
export function useAddressSearch(query: string, city: SearchCity | null) {
  const geocoding = useMapsLibrary("geocoding");
  const [found, setFound] = useState<{ input: string; hit: AddressHit | null } | null>(null);
  const input = query.trim();

  useEffect(() => {
    if (!geocoding || input.length < 2) return;
    const lib = geocoding;
    let cancelled = false;

    async function search() {
      try {
        const res = await new lib.Geocoder().geocode({
          address: input,
          language: "ko",
          ...(city && geocodeArea(city)),
        });
        const best = res.results.find((r) => {
          const at = { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() };
          return !city || withinSearchArea(city, at);
        });
        const hit = best && {
          label: cleanAddress(best),
          lat: best.geometry.location.lat(),
          lng: best.geometry.location.lng(),
        };
        if (!cancelled) setFound({ input, hit: hit ?? null });
      } catch {
        // 결과 없음(ZERO_RESULTS)도 예외로 온다. 주소 줄을 숨길 뿐 장소 검색은 그대로 쓴다
        if (!cancelled) setFound({ input, hit: null });
      }
    }
    const handle = setTimeout(() => void search(), DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [geocoding, input, city]);

  return found && found.input === input ? found.hit : null;
}
