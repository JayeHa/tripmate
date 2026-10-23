"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { deleteMove, fetchMoves, type MoveInput, saveMove } from "../api/moves";

/** 여행의 이동 기록 */
export function useMoves(tripId: string) {
  return useQuery(movesQuery(tripId));
}

/** 이동 기록의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const movesQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.moves(tripId), queryFn: () => fetchMoves(tripId) });

/** 이동 방법 저장(덮어쓰기) */
export function useSaveMove(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<MoveInput, "tripId">) => saveMove({ ...input, tripId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.moves(tripId) }),
  });
}

/** 이동 방법 지우기 */
export function useDeleteMove(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fromItemId, toItemId }: { fromItemId: string; toItemId: string }) =>
      deleteMove(fromItemId, toItemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.moves(tripId) }),
  });
}
