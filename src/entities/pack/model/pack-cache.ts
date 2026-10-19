"use client";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import type { PackLists } from "./types";

/** 캐시를 고치고 끝나면 다시 읽는 도구 — 화면 먼저 바꾸는 뮤테이션들이 함께 쓴다 */
export function usePackCache(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.packLists(tripId);
  return {
    get: () => qc.getQueryData<PackLists>(key),
    set: (fn: (lists: PackLists) => PackLists) =>
      qc.setQueryData<PackLists>(key, (lists) => (lists ? fn(lists) : lists)),
    /** 되돌리기 — onMutate 에서 받아 둔 목록을 그대로 */
    restore: (lists: PackLists | undefined) => {
      if (lists) qc.setQueryData<PackLists>(key, lists);
    },
    cancel: () => qc.cancelQueries({ queryKey: key, exact: true }),
    invalidate: () => qc.invalidateQueries({ queryKey: key, exact: true }),
  };
}
