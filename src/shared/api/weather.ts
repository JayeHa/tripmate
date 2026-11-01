"use client";

import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";

import type { WeatherDay, WeatherNormals } from "@/shared/lib/weather";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";

import { queryKeys } from "./query-keys";

/** 예보는 서버가 한 시간마다 새로 받는다 */
const HOUR = 60 * 60 * 1000;
/** 평년은 지난 기록이라 바뀌지 않는다 */
const MONTH = 30 * 24 * HOUR;

/** 서버 라우트에서 JSON 을 받는다. 실패하면 던진다(화면은 날씨 타일을 뺀다) */
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return (await res.json()) as T;
}

/** 도시의 앞으로 16일 예보 조회 정의 — 기기에 남겨 여행 중 오프라인에서도 받아 둔 날의 예보가 보인다 */
export const forecastQuery = (city: string) =>
  queryOptions({
    queryKey: queryKeys.weather.forecast(city),
    queryFn: () => getJson<WeatherDay[]>(`/api/weather/forecast?city=${encodeURIComponent(city)}`),
    staleTime: HOUR,
    retry: 1,
  });

/** 도시의 그 달(1–12) 평년 기온 조회 정의 */
export const normalsQuery = (city: string, month: number) =>
  queryOptions({
    queryKey: queryKeys.weather.normals(city, month),
    queryFn: () =>
      getJson<WeatherNormals>(
        `/api/weather/normals?city=${encodeURIComponent(city)}&month=${month}`,
      ),
    staleTime: MONTH,
    retry: 1,
  });

/** 도시(id)의 하루 예보(날짜순). 도시를 모르거나(null) 받는 중 · 실패하면 data 가 없다 */
export function useForecast(city: string | null) {
  return useQuery({ ...forecastQuery(city ?? ""), enabled: !!city });
}

/** 도시(id)의 그 달 평년 기온. 도시 · 달을 모르거나(null) 받는 중 · 실패하면 data 가 없다 */
export function useNormals(city: string | null, month: number | null) {
  return useQuery({ ...normalsQuery(city ?? "", month ?? 1), enabled: !!city && month !== null });
}

/** 도시의 기간(양끝 포함) 날마다 날씨 조회 정의 — 기록 · 예보 · 작년 · 평년이 섞여 와서 예보에 맞춰 한 시간마다 다시 받는다 */
export const weatherDaysQuery = (city: string, from: string, to: string) =>
  queryOptions({
    queryKey: queryKeys.weather.days(city, from, to),
    queryFn: () =>
      getJson<SourcedWeatherDay[]>(
        `/api/weather/days?${new URLSearchParams({ city, from, to }).toString()}`,
      ),
    staleTime: HOUR,
    retry: 1,
  });

/**
 * 도시들(id)의 기간 날마다 날씨 — 도시 → 날짜 → 그날 날씨. 기간을 모르면(null) 부르지 않는다.
 * 받는 중 · 실패한 도시는 빠진다(그 도시의 날은 날씨 줄이 없다)
 */
export function useWeatherDays(
  cities: readonly string[],
  range: { from: string; to: string } | null,
) {
  return useQueries({
    queries: cities.map((city) => ({
      ...weatherDaysQuery(city, range?.from ?? "", range?.to ?? ""),
      enabled: !!range,
    })),
    combine: (results) =>
      new Map(
        cities.map((city, i) => [
          city,
          new Map((results[i]?.data ?? []).map((d) => [d.date, d] as const)),
        ]),
      ),
  });
}
