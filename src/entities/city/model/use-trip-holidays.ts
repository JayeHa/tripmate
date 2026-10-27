"use client";

import { useCountryHolidays } from "@/shared/api/holidays";

import { useTripCities } from "./use-city-catalog";

/**
 * 여행지 공휴일 — 여행의 첫 도시 나라 기준, 여행 기간 안만 날짜순. 여행(기간)을 아직 모르면 빈 목록,
 * 도시 · 공휴일을 받는 중이거나 실패하면 undefined. 여행 홈 위젯 · 일정 day 머리 · 가계부 날짜 줄이 같이 쓴다
 */
export function useTripHolidays(
  tripId: string,
  trip: { start_date: string; end_date: string } | undefined,
) {
  const country = useTripCities(tripId).data?.[0]?.country_code ?? null;
  return useCountryHolidays(country, trip?.start_date ?? "", trip?.end_date ?? "");
}
