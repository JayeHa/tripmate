"use client";

import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { dayIndexToDate } from "@/shared/lib/days";
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
 * 도시들(id)의 기간 날마다 날씨 — 도시 → 날짜 → 그날 날씨(byCity)와, 아직 처음 받는 중인 도시가 있는지(loading).
 * 기간을 모르면(null) 부르지 않는다. 실패한 도시는 빠진다(그 도시의 날은 날씨가 없다)
 */
function useWeatherDays(cities: readonly string[], range: { from: string; to: string } | null) {
  return useQueries({
    queries: cities.map((city) => ({
      ...weatherDaysQuery(city, range?.from ?? "", range?.to ?? ""),
      enabled: !!range,
    })),
    combine: (results) => ({
      byCity: new Map(
        cities.map((city, i) => [
          city,
          new Map((results[i]?.data ?? []).map((d) => [d.date, d] as const)),
        ]),
      ),
      loading: results.some((r) => r.data === undefined && r.fetchStatus === "fetching"),
    }),
  });
}

/**
 * 여행의 날마다 날씨 — perDay[i] 는 i번째 날(0-base)의 도시 id(`dayCities`). 도시마다 여행 기간을 한 번에 받는다.
 * weatherOf(day) 는 그 날 날씨 — 여행 · 도시를 모르거나 받는 중 · 실패면 null. loading 은 처음 받는 중인지
 * (오프라인이라 멈춘 요청은 받는 중이 아니다 — 기기에 남은 값만 보인다)
 */
export function useTripDayWeather(
  perDay: readonly (string | null)[],
  trip: { start_date: string; end_date: string } | undefined,
) {
  const ids = useMemo(() => [...new Set(perDay.filter((c): c is string => c !== null))], [perDay]);
  const { byCity, loading } = useWeatherDays(
    ids,
    trip ? { from: trip.start_date, to: trip.end_date } : null,
  );
  const weatherOf = (day: number): SourcedWeatherDay | null => {
    const city = perDay[day];
    if (!trip || !city) return null;
    return byCity.get(city)?.get(dayIndexToDate(trip.start_date, day)) ?? null;
  };
  return { weatherOf, loading };
}
