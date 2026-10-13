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
 * 체크박스 — 화면을 먼저 바꾸고(묶음이 바로 옮겨지게) 서버에 보낸다. 실패하면 그 항목의 상태만 되돌린다
 * (목록 전체를 되돌리면 그 사이 바꾼 다른 항목까지 잠깐 원래대로 보인다).
 * 요청은 여행마다 한 줄로 차례대로 보낸다(scope) — 같은 항목을 빠르게 완료 → 취소하면 순서가 뒤바뀌어 「완료」 로 남을 수 있다.
 * 화면은 누를 때마다 바로 바뀌고, 다시 읽기는 보낼 것이 다 끝났을 때 한 번만 한다(중간에 읽으면 아직 안 보낸 체크가 잠깐 풀린다)
 */
export function useSetChecklistStatus(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.checklist(tripId);
  const mutationKey = ["checklist-status", tripId];
  return useMutation({
    mutationKey,
    scope: { id: `checklist-status-${tripId}` },
    mutationFn: (v: { id: string; status: ChecklistStatus }) => setChecklistStatus(v.id, v.status),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<ChecklistItem[]>(key)?.find((i) => i.id === v.id)?.status;
      setStatusIn(v.id, v.status);
      return { before };
    },
    onError: (_e, v, ctx) => {
      if (ctx?.before) setStatusIn(v.id, ctx.before);
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey }) === 1) void qc.invalidateQueries({ queryKey: key });
    },
  });

  /** 캐시의 그 항목 상태만 바꾼다 */
  function setStatusIn(id: string, status: string) {
    qc.setQueryData<ChecklistItem[]>(key, (items) =>
      items?.map((i) => (i.id === id ? { ...i, status } : i)),
    );
  }
}
