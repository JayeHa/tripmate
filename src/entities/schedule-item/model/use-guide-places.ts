"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchGuidePlaces } from "../api/guide-places";

/** 가이드 보관함의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const guidePlacesQuery = (tripId: string) =>
  queryOptions({
    queryKey: queryKeys.guidePlaces(tripId),
    queryFn: () => fetchGuidePlaces(tripId),
  });

/** 여행 가이드 보관함 — 일행이 모은 장소(일정에 넣은 장소 포함) */
export function useGuidePlaces(tripId: string) {
  return useQuery(guidePlacesQuery(tripId));
}
