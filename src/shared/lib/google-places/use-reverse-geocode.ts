"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

import { cleanAddress, koreanAddress, pickGeocode } from "./address";

type LatLng = { lat: number; lng: number };

/** 핀이 이만큼 멈춰 있으면 주소를 묻는다(끌기 · 확대 중에는 묻지 않는다) */
const SETTLE_MS = 450;

/** 좌표 한 점의 주소 결과. key 로 어느 좌표의 결과인지 가린다 */
type Found = {
  key: string;
  address: string | null;
  addressLocal: string | null;
  addressKo: string | null;
  failed: boolean;
};

/** 좌표를 결과 key 로. 1e-6°(약 10cm) 아래는 같은 점으로 본다 */
const keyOf = (at: LatLng) => `${at.lat.toFixed(6)},${at.lng.toFixed(6)}`;

/**
 * 핀 위치의 주소(역지오코딩). 한국어로 한 번, 현지어(`localLanguage`)로 한 번 묻는다 — 지도가 멈출 때마다 최대 2회 과금.
 * 일본처럼 구글에 한국어 번지 표기가 없는 곳은 한국어 요청도 로마자로 온다. 같은 응답의 한글 동네 이름 + 번지 숫자로
 * 한글 줄(`addressKo`)을 따로 만든다(docs/policies/place-search.md).
 *
 * - busy: 지금 좌표의 결과를 기다리는 중
 * - failed: 묻지 못했다(네트워크 · 키 권한). 주소 없이도 다음 단계로 갈 수 있게 부른 쪽이 판단한다
 *
 * @see https://developers.google.com/maps/documentation/javascript/geocoding
 */
export function useReverseGeocode(at: LatLng | null, localLanguage: string | null) {
  const geocoding = useMapsLibrary("geocoding");
  const [found, setFound] = useState<Found | null>(null);
  const key = at ? keyOf(at) : null;

  useEffect(() => {
    if (!geocoding || !at || !key) return;
    const lib = geocoding;
    const location = at;
    let cancelled = false;

    /** 한 언어로 물어 정리한 번지 주소와 한글 줄. 결과가 없으면 null */
    async function lookup(geocoder: google.maps.Geocoder, language: string) {
      const res = await geocoder.geocode({ location, language });
      const best = pickGeocode(res.results);
      return { line: best ? cleanAddress(best) : null, korean: koreanAddress(res.results, best) };
    }

    async function run() {
      const geocoder = new lib.Geocoder();
      try {
        const [ko, local] = await Promise.all([
          lookup(geocoder, "ko"),
          localLanguage ? lookup(geocoder, localLanguage) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setFound({
          key: key ?? "",
          address: ko.line,
          addressLocal: local?.line ?? null,
          addressKo: ko.korean,
          failed: false,
        });
      } catch {
        if (!cancelled)
          setFound({
            key: key ?? "",
            address: null,
            addressLocal: null,
            addressKo: null,
            failed: true,
          });
      }
    }
    const handle = setTimeout(() => void run(), SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // 좌표는 값(key)으로 비교한다 — 같은 점의 새 객체로 다시 묻지 않게
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocoding, key, localLanguage]);

  const current = found && found.key === key ? found : null;
  return {
    address: current?.address ?? null,
    addressLocal: current?.addressLocal ?? null,
    addressKo: current?.addressKo ?? null,
    busy: !!key && !current,
    failed: current?.failed ?? false,
  };
}
