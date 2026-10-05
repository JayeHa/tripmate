"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import type { TablesInsert, TablesUpdate } from "@/shared/api/supabase/database.types";

import { createMemo, deleteMemo, fetchMemos, updateMemo } from "../api/memos";

/** 여행의 메모 전부 — 타임라인 · 일정 상세가 일정마다 골라 쓴다 */
export function useMemos(tripId: string) {
  return useQuery({ queryKey: queryKeys.memos(tripId), queryFn: () => fetchMemos(tripId) });
}

/** 메모를 다시 읽는다. 끝날 때까지 기다리는 Promise — mutateAsync 가 새 목록을 받은 뒤 끝나게 */
function useRefetchMemos(tripId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.memos(tripId) });
}

export function useCreateMemo(tripId: string) {
  const refetch = useRefetchMemos(tripId);
  return useMutation({
    mutationFn: (memo: TablesInsert<"memos">) => createMemo(memo),
    onSuccess: refetch,
  });
}

export function useUpdateMemo(tripId: string) {
  const refetch = useRefetchMemos(tripId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"memos"> }) =>
      updateMemo(id, patch),
    onSuccess: refetch,
  });
}

export function useDeleteMemo(tripId: string) {
  const refetch = useRefetchMemos(tripId);
  return useMutation({ mutationFn: deleteMemo, onSuccess: refetch });
}
