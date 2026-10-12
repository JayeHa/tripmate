"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { addChecklistItem, fetchChecklist, setChecklistStatus } from "../api/checklist";
import type { ChecklistItem, ChecklistStatus } from "./types";

/** 여행의 체크리스트 */
export function useChecklist(tripId: string) {
  return useQuery({
    queryKey: queryKeys.checklist(tripId),
    queryFn: () => fetchChecklist(tripId),
  });
}

/** 빠른 추가 — 성공하면 목록을 다시 읽는다 */
export function useAddChecklistItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => addChecklistItem(tripId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.checklist(tripId) }),
  });
}

/**
 * 체크박스 — 화면을 먼저 바꾸고(묶음이 바로 옮겨지게) 서버에 보낸다. 실패하면 되돌리고, 끝나면 다시 읽는다
 */
export function useSetChecklistStatus(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.checklist(tripId);
  return useMutation({
    mutationFn: (v: { id: string; status: ChecklistStatus }) => setChecklistStatus(v.id, v.status),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<ChecklistItem[]>(key);
      qc.setQueryData<ChecklistItem[]>(key, (items) =>
        items?.map((i) => (i.id === v.id ? { ...i, status: v.status } : i)),
      );
      return { before };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.before),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
