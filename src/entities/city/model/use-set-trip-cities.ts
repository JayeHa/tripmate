"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { setTripCities } from "../api/cities";
import type { City } from "./types";

/**
 * 여행 도시 바꾸기(여행 홈 「편집」) — 고른 도시로 바로 바꾸고 목록(「N개 도시」 · 썸네일)만 다시 읽는다.
 * 날씨 · 공휴일은 도시 · 나라를 키로 받아서 첫 도시가 바뀌면 알아서 새로 받는다
 */
export function useSetTripCities(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cities: City[]) =>
      setTripCities(
        tripId,
        cities.map((c) => c.id),
      ),
    onSuccess: (_data, cities) => {
      qc.setQueryData(queryKeys.tripCities(tripId), cities);
      void qc.invalidateQueries({ queryKey: queryKeys.trips.all, exact: true });
    },
  });
}
