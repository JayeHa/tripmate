"use client";

import { useMutation } from "@tanstack/react-query";

import { deletePackItem, uncheckPackItems, updatePackItem } from "../api/pack";
import type { PackItemPatch } from "../lib/board";
import { usePackCache } from "./pack-cache";

/** 항목 고치기(상세의 저장) — 화면 먼저, 실패하면 저장 전 목록으로 되돌린다 */
export function useUpdatePackItem(tripId: string) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (v: { id: string; patch: PackItemPatch }) => updatePackItem(v.id, v.patch),
    onMutate: async (v) => {
      await cache.cancel();
      const before = cache.get();
      cache.set((l) => ({
        ...l,
        items: l.items.map((i) => (i.id === v.id ? { ...i, ...v.patch } : i)),
      }));
      return { before };
    },
    onError: (_e, _v, ctx) => cache.restore(ctx?.before),
    onSettled: cache.invalidate,
  });
}

/** 항목 지우기 — 화면에서 먼저 빼고, 실패하면 되돌린다 */
export function useDeletePackItem(tripId: string) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (id: string) => deletePackItem(id),
    onMutate: async (id) => {
      await cache.cancel();
      const before = cache.get();
      cache.set((l) => ({ ...l, items: l.items.filter((i) => i.id !== id) }));
      return { before };
    },
    onError: (_e, _id, ctx) => cache.restore(ctx?.before),
    onSettled: cache.invalidate,
  });
}

/** 「모두 해제」 — 받은 항목의 챙김을 화면 먼저 풀고, 실패하면 되돌린다 */
export function useUncheckPackItems(tripId: string) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (ids: string[]) => uncheckPackItems(ids),
    onMutate: async (ids) => {
      await cache.cancel();
      const before = cache.get();
      const set = new Set(ids);
      cache.set((l) => ({
        ...l,
        items: l.items.map((i) =>
          set.has(i.id) ? { ...i, checked_at: null, checked_by: null } : i,
        ),
      }));
      return { before };
    },
    onError: (_e, _ids, ctx) => cache.restore(ctx?.before),
    onSettled: cache.invalidate,
  });
}
