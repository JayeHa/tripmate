"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { addSettlement, fetchSettlements, removeSettlement } from "../api/settlements";
import type { PersonRef } from "../lib/person";

/** 송금 기록의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const settlementsQuery = (tripId: string) =>
  queryOptions({
    queryKey: queryKeys.settlements(tripId),
    queryFn: () => fetchSettlements(tripId),
  });

export function useSettlements(tripId: string) {
  return useQuery(settlementsQuery(tripId));
}

/** 「받았어요 · 보냈어요」 와 되돌리기 — 끝나면 보낸 기록을 다시 읽는다 */
export function useSettlementActions(tripId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.settlements(tripId) });
  return {
    add: useMutation({
      mutationFn: ({
        from,
        to,
        amount,
        createdBy,
      }: {
        from: PersonRef;
        to: PersonRef;
        amount: number;
        createdBy: string;
      }) => addSettlement(tripId, from, to, amount, createdBy),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: removeSettlement, onSuccess: invalidate }),
  };
}
