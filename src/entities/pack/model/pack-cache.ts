"use client";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import type { PackItem, PackLists } from "./types";

/** 캐시를 고치고 끝나면 다시 읽는 도구 — 화면 먼저 바꾸는 뮤테이션들이 함께 쓴다 */
export function usePackCache(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.packLists(tripId);
  return {
    get: () => qc.getQueryData<PackLists>(key),
    set: (fn: (lists: PackLists) => PackLists) =>
      qc.setQueryData<PackLists>(key, (lists) => (lists ? fn(lists) : lists)),
    /**
     * 되돌리기 — onMutate 때 받아 둔 그 항목들만 그때 모습으로(없어졌으면 다시 넣는다).
     * 목록 전체를 되돌리면 그사이 다른 줄에 한 체크 · 삭제까지 다시 읽기 전까지 되돌아 보인다
     */
    restoreItems: (before: readonly PackItem[]) => {
      const byId = new Map(before.map((i) => [i.id, i]));
      qc.setQueryData<PackLists>(key, (lists) => {
        if (!lists) return lists;
        const kept = lists.items.map((i) => byId.get(i.id) ?? i);
        const gone = before.filter((b) => !lists.items.some((i) => i.id === b.id));
        return { ...lists, items: [...kept, ...gone] };
      });
    },
    cancel: () => qc.cancelQueries({ queryKey: key, exact: true }),
    invalidate: () => qc.invalidateQueries({ queryKey: key, exact: true }),
  };
}
