"use client";

import { useCallback, useMemo } from "react";

import { useFlights } from "@/entities/flight";
import type { FlightTimes } from "@/entities/schedule-item";

/**
 * 항공편 카드(flight_id) → 편명 시각. 노선도의 비행 구간이 쓴다. 목록을 아직 못 읽었으면 null.
 * 노선도가 하루마다 메모해 두므로 목록이 바뀔 때만 새 함수를 준다
 */
export function useFlightTimes(tripId: string): (id: string) => FlightTimes | null {
  const { data: flights } = useFlights(tripId);
  const byId = useMemo(() => new Map((flights ?? []).map((f) => [f.id, f])), [flights]);
  return useCallback((id: string) => byId.get(id) ?? null, [byId]);
}
