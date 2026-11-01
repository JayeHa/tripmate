"use client";

import type { City } from "@/entities/city";
import { useForecast, useNormals } from "@/shared/api/weather";

import { localToday, weatherOutfit, weatherPlan, weatherTile } from "../lib/weather-tile";

/**
 * 날씨 타일 — 여행의 첫 도시로(서버가 도시 목록의 좌표로 받는다). 여행 10일 전부터는 예보(여행 중이면 오늘, 그 전에는 첫날), 그보다 이르면 그 달의 평년 기온만 받는다.
 * 같은 날(평년이면 그 달)의 추천 옷차림도 함께 돌려준다.
 * 도시를 모르거나 · 받는 중 · 실패 · 여행이 끝났으면 둘 다 null(타일이 빠진다)
 */
export function useWeatherTile(
  city: City | undefined,
  trip: { start_date: string; end_date: string },
  at: Date,
) {
  const plan = city
    ? weatherPlan(trip.start_date, trip.end_date, localToday(city.timezone, at))
    : null;
  const id = city?.id ?? null;
  const forecast = useForecast(plan?.kind === "forecast" ? id : null).data;
  const normals = useNormals(
    plan?.kind === "normals" ? id : null,
    plan?.kind === "normals" ? plan.month : null,
  ).data;
  return {
    tile: weatherTile(plan, forecast, normals),
    outfit: weatherOutfit(plan, forecast, normals),
  };
}
