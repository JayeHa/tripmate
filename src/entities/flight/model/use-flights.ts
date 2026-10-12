"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { deleteFlight, fetchFlights, saveFlight } from "../api/flights";
import type { FlightFieldsInput } from "./types";

/** 여행의 항공편 목록 */
export function useFlights(tripId: string) {
  return useQuery({ queryKey: queryKeys.flights(tripId), queryFn: () => fetchFlights(tripId) });
}

/** 항공편이 바뀌면 다시 읽을 것 — 항공편 · 연결 카드(일정 · 메모 · 경로) */
function useInvalidateFlights(tripId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.flights(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.memos(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
  };
}

/** 항공편 저장(새로 · 고치기) */
export function useSaveFlight(tripId: string) {
  const invalidate = useInvalidateFlights(tripId);
  return useMutation({
    mutationFn: (v: { flightId: string | null; fields: FlightFieldsInput }) =>
      saveFlight(tripId, v.flightId, v.fields),
    onSuccess: invalidate,
  });
}

/** 항공편 지우기 — 연결 카드도 함께 */
export function useDeleteFlight(tripId: string) {
  const invalidate = useInvalidateFlights(tripId);
  return useMutation({
    mutationFn: (flightId: string) => deleteFlight(flightId),
    onSuccess: invalidate,
  });
}
