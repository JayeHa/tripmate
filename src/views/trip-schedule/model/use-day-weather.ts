"use client";

import { useMemo } from "react";

import { useTripCities } from "@/entities/city";
import { dayCities, type TimelineRow } from "@/entities/schedule-item";
import { useTripDayWeather } from "@/shared/api/weather";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";

/**
 * 날짜 머리의 날씨 — 날마다 그날 장소의 도시로(여러 도시 여행), 도시마다 여행 기간을 한 번에 받는다.
 * 돌려주는 함수는 그 날(0-base)의 날씨, 여행 · 도시를 모르거나 받는 중 · 실패면 null(날씨 줄이 빠진다)
 */
export function useDayWeather(
  tripId: string,
  trip: { start_date: string; end_date: string } | undefined,
  sections: readonly { rows: readonly TimelineRow[] }[],
): (day: number) => SourcedWeatherDay | null {
  const { data: cities } = useTripCities(tripId);
  const firstCity = cities?.[0]?.id ?? null;
  const perDay = useMemo(
    () =>
      dayCities(
        sections.map((s) => s.rows.map((r) => r.item)),
        firstCity,
      ),
    [sections, firstCity],
  );
  return useTripDayWeather(perDay, trip).weatherOf;
}
