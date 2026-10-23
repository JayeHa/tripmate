"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchCityCatalog, fetchTripCities } from "../api/cities";

const DAY = 24 * 60 * 60 * 1000;

/** 도시 기준 데이터. 마이그레이션으로만 바뀌므로 하루 동안 다시 받지 않는다. */
export function useCityCatalog() {
  return useQuery(cityCatalogQuery());
}

/** 도시 기준 데이터의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const cityCatalogQuery = () =>
  queryOptions({ queryKey: queryKeys.cities, queryFn: fetchCityCatalog, staleTime: DAY });

/** 여행이 고른 도시(순서대로). 여행 화면에서 쓴다 */
export function useTripCities(tripId: string) {
  return useQuery(tripCitiesQuery(tripId));
}

/** 여행 도시의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const tripCitiesQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.tripCities(tripId), queryFn: () => fetchTripCities(tripId) });
