"use client";

import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";

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
 * 다시 읽기는 진행 중인 체크가 다 끝났을 때 한 번만 한다(중간에 읽으면 아직 응답 전인 다른 체크가 잠깐 풀린다).
 * 같은 항목의 순서는 부르는 쪽이 `usePendingChecklistIds` 로 막는다 — `scope` 로 줄 세우면 기다리는 요청이 「일시정지」 로
 * 저장소(IndexedDB)에 남고, 새로고침 뒤 요청 함수 없이 복원돼 그 줄이 영영 막힌다
 */
export function useSetChecklistStatus(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.checklist(tripId);
  const mutationKey = statusKey(tripId);
  return useMutation({
    mutationKey,
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

/** 체크 요청의 mutationKey — 진행 중인 것을 세고 찾는다 */
function statusKey(tripId: string) {
  return ["checklist-status", tripId];
}

/**
 * 체크 요청이 진행 중인 항목 id — 응답 전에 같은 항목을 다시 누르면 무시하게.
 * 두 요청이 순서 보장 없이 나가 완료 → 취소가 「완료」 로 남는 것을 막는다
 */
export function usePendingChecklistIds(tripId: string): string[] {
  return useMutationState({
    filters: { mutationKey: statusKey(tripId), status: "pending" },
    select: (m) => (m.state.variables as { id: string } | undefined)?.id ?? "",
  });
}
