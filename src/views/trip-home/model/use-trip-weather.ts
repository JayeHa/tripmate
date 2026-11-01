"use client";

import { useMemo } from "react";

import { useTripCities } from "@/entities/city";
import { dayCities, itemsByDay, useScheduleItems } from "@/entities/schedule-item";
import { useTripDayWeather } from "@/shared/api/weather";
import { dayCount } from "@/shared/lib/days";

/**
 * 여행 기간 날마다 날씨 — 일정 화면 날짜 머리와 같은 규칙(그날 장소가 가장 많은 도시, 없으면 전날 · 첫 도시)과 같은 데이터.
 * days 는 0-base 날 수만큼, weatherOf(day) 는 그 날 날씨(받는 중 · 실패 · 도시를 모르면 null), loading 은 처음 받는 중인지
 */
export function useTripWeather(tripId: string, trip: { start_date: string; end_date: string }) {
  const firstCity = useTripCities(tripId).data?.[0]?.id ?? null;
  const items = useScheduleItems(tripId).data;
  const total = dayCount(trip.start_date, trip.end_date);
  const perDay = useMemo(
    () => dayCities(itemsByDay(items ?? [], total), firstCity),
    [items, total, firstCity],
  );
  const { weatherOf, loading } = useTripDayWeather(perDay, trip);
  return { total, weatherOf, loading };
}
