"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchGuidePlaces, removeGuidePlace, setGuideMemo } from "../api/guide-places";

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

/** 보관함에서 빼기 — 끝나면 보관함을 다시 읽는다 */
export function useRemoveGuidePlace(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (placeId: string) => removeGuidePlace(tripId, placeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.guidePlaces(tripId), exact: true });
    },
  });
}

/** 가이드 메모 저장 — 끝나면 보관함을 다시 읽는다 */
export function useSetGuideMemo(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, memo }: { placeId: string; memo: string }) =>
      setGuideMemo(tripId, placeId, memo),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.guidePlaces(tripId), exact: true });
    },
  });
}
