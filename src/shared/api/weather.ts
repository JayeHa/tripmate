"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import type { WeatherDay, WeatherNormals } from "@/shared/lib/weather";

import { queryKeys } from "./query-keys";

/** 예보는 서버가 한 시간마다 새로 받는다 */
const HOUR = 60 * 60 * 1000;
/** 평년은 지난 기록이라 바뀌지 않는다 */
const MONTH = 30 * 24 * HOUR;

/** 좌표 */
export type Coords = { lat: number; lng: number };

/** 서버 라우트에서 JSON 을 받는다. 실패하면 던진다(화면은 날씨 타일을 뺀다) */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return (await res.json()) as T;
}

/** 장소의 앞으로 16일 예보 조회 정의 — 기기에 남겨 여행 중 오프라인에서도 받아 둔 날의 예보가 보인다 */
export const forecastQuery = ({ lat, lng }: Coords) =>
  queryOptions({
    queryKey: queryKeys.weather.forecast(lat, lng),
    queryFn: () => getJson<WeatherDay[]>(`/api/weather/forecast?lat=${lat}&lng=${lng}`),
    staleTime: HOUR,
    retry: 1,
  });

/** 장소의 그 달(1–12) 평년 기온 조회 정의 */
export const normalsQuery = ({ lat, lng }: Coords, month: number) =>
  queryOptions({
    queryKey: queryKeys.weather.normals(lat, lng, month),
    queryFn: () =>
      getJson<WeatherNormals>(`/api/weather/normals?lat=${lat}&lng=${lng}&month=${month}`),
    staleTime: MONTH,
    retry: 1,
  });

/** 장소의 하루 예보(날짜순). 좌표를 모르거나(null) 받는 중 · 실패하면 data 가 없다 */
export function useForecast(coords: Coords | null) {
  return useQuery({ ...forecastQuery(coords ?? { lat: 0, lng: 0 }), enabled: !!coords });
}

/** 장소의 그 달 평년 기온. 좌표 · 달을 모르거나(null) 받는 중 · 실패하면 data 가 없다 */
export function useNormals(coords: Coords | null, month: number | null) {
  return useQuery({
    ...normalsQuery(coords ?? { lat: 0, lng: 0 }, month ?? 1),
    enabled: !!coords && month !== null,
  });
}
