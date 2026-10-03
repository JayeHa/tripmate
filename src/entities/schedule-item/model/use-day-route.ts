"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import type { DayRoute, TravelMode } from "./types";

async function fetchDayRoute(
  tripId: string,
  dayIndex: number,
  travelMode: TravelMode,
): Promise<DayRoute> {
  const res = await fetch("/api/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tripId, dayIndex, travelMode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "경로를 가져오지 못했어요");
  return json as DayRoute;
}

/**
 * 해당 날의 경로. 서버가 day_routes 에 캐시하므로 아이템이 바뀌지 않으면 API 호출 없음.
 * enabled=false 이면 조회하지 않음 (지도에 표시할 좌표가 2개 미만일 때 등)
 */
export function useDayRoute(
  tripId: string,
  dayIndex: number,
  travelMode: TravelMode,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.dayRoute(tripId, dayIndex, travelMode),
    queryFn: () => fetchDayRoute(tripId, dayIndex, travelMode),
    enabled,
    staleTime: 5 * 60 * 1000,
    networkMode: "online",
  });
}
