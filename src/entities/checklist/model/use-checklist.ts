"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/shared/api/query-keys";
import type { SyncResult } from "@/shared/api/sync";

import {
  addChecklistItem,
  CHECKLIST_GONE,
  deleteChecklistItem,
  fetchChecklist,
  fetchChecklistTargets,
  saveChecklistItem,
  setChecklistPin,
} from "../api/checklist";
import { type ChecklistIndex, checklistIndex } from "../lib/by-target";
import { CHECKLIST_STATUS_KEY, type ChecklistStatusVars } from "./checklist-sync";
import type { ChecklistItem, ChecklistSave, ChecklistStatus } from "./types";

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
 * 체크박스 — 오프라인에서도 되는 저장(대기열). 함수 · 화면 먼저 바꾸기 · 되돌리기는 `registerChecklistSync` 에 있다.
 * 누를 때 본 항목의 버전을 함께 보내, 그사이 일행이 고쳤는지 올릴 때 가린다. 같은 항목을 연달아 눌러도 대기열이 한 줄이라 누른 순서대로 올라간다.
 * 결과는 호출마다 받는다(mutateAsync) — 오프라인이면 연결되어 올라갈 때까지 끝나지 않는다
 */
export function useSetChecklistStatus(tripId: string) {
  const qc = useQueryClient();
  const mutation = useMutation<SyncResult, Error, ChecklistStatusVars>({
    mutationKey: CHECKLIST_STATUS_KEY,
  });
  return {
    mutateAsync: async (v: { id: string; status: ChecklistStatus }) => {
      const item = qc
        .getQueryData<ChecklistItem[]>(queryKeys.checklist(tripId))
        ?.find((i) => i.id === v.id);
      if (!item) throw new Error(CHECKLIST_GONE);
      return mutation.mutateAsync({ tripId, ...v, version: item.updated_at });
    },
  };
}

/** 여행의 체크리스트 연결(일정 카드 · 항공편 · 숙소) */
export function useChecklistTargets(tripId: string) {
  return useQuery({
    queryKey: queryKeys.checklistTargets(tripId),
    queryFn: () => fetchChecklistTargets(tripId),
  });
}

/**
 * 대상(일정 카드 · 항공편 · 숙소)마다 연결된 항목 — 목록 · 연결을 읽기 전에는 빈 색인.
 * 쿼리 데이터가 바뀔 때만 다시 만든다
 */
export function useChecklistIndex(tripId: string): ChecklistIndex {
  const { data: items } = useChecklist(tripId);
  const { data: rows } = useChecklistTargets(tripId);
  return useMemo(() => checklistIndex(items ?? [], rows ?? []), [items, rows]);
}

/** 목록과 연결을 다시 읽는다 — 저장 · 지우기는 둘 다 바꾼다(항목을 지우면 연결도 지워진다) */
function useInvalidateChecklist(tripId: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.checklist(tripId) }),
      qc.invalidateQueries({ queryKey: queryKeys.checklistTargets(tripId) }),
    ]);
}

/** 추가 · 편집 창 저장(항목 칸 + 연결, id 가 null 이면 새로) — 끝나면 목록 · 연결을 다시 읽는다 */
export function useSaveChecklistItem(tripId: string) {
  const invalidate = useInvalidateChecklist(tripId);
  return useMutation({
    mutationFn: (v: ChecklistSave) => saveChecklistItem(tripId, v),
    onSettled: invalidate,
  });
}

/** 지우기 — 끝나면 목록 · 연결을 다시 읽는다 */
export function useDeleteChecklistItem(tripId: string) {
  const invalidate = useInvalidateChecklist(tripId);
  return useMutation({
    mutationFn: (id: string) => deleteChecklistItem(id),
    onSettled: invalidate,
  });
}

/**
 * 읽기 화면의 「홈에 고정」 — 누르면 바로 바뀌고(화면 먼저) 서버에 보낸다. 실패하면 그 항목만 되돌린다
 */
export function useSetChecklistPin(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.checklist(tripId);
  /** 캐시의 그 항목 고정만 바꾼다 */
  const setPinIn = (id: string, pinnedBy: string | null) =>
    qc.setQueryData<ChecklistItem[]>(key, (items) =>
      items?.map((i) => (i.id === id ? { ...i, pinned_by: pinnedBy } : i)),
    );
  return useMutation({
    mutationFn: (v: { id: string; pinnedBy: string | null }) => setChecklistPin(v.id, v.pinnedBy),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<ChecklistItem[]>(key)?.find((i) => i.id === v.id);
      setPinIn(v.id, v.pinnedBy);
      return { before: before?.pinned_by ?? null };
    },
    onError: (_e, v, ctx) => setPinIn(v.id, ctx?.before ?? null),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
