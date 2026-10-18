"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import {
  addPackGroup,
  addPackItem,
  addPackPresets,
  deletePackGroup,
  fetchPackLists,
  renamePackGroup,
  setPackItemChecked,
} from "../api/pack";
import { nextPosition } from "../lib/board";
import type { PackKind, PackLists, PackPreset } from "./types";

/** 여행의 준비물 · 쇼핑(두 종류 함께) */
export function usePackLists(tripId: string) {
  return useQuery({
    queryKey: queryKeys.packLists(tripId),
    queryFn: () => fetchPackLists(tripId),
  });
}

/** 캐시를 고치고 끝나면 다시 읽는 도구 — 화면 먼저 바꾸는 뮤테이션들이 함께 쓴다 */
function usePackCache(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.packLists(tripId);
  return {
    get: () => qc.getQueryData<PackLists>(key),
    set: (fn: (lists: PackLists) => PackLists) =>
      qc.setQueryData<PackLists>(key, (lists) => (lists ? fn(lists) : lists)),
    cancel: () => qc.cancelQueries({ queryKey: key, exact: true }),
    invalidate: () => qc.invalidateQueries({ queryKey: key, exact: true }),
  };
}

/** 그룹 추가 — 맨 뒤에. 저장되면 바로 목록에 넣는다 */
export function useAddPackGroup(tripId: string, kind: PackKind) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (name: string) => {
      const groups = (cache.get()?.groups ?? []).filter((g) => g.kind === kind);
      return addPackGroup(tripId, kind, name, nextPosition(groups));
    },
    onSuccess: (group) => cache.set((l) => ({ ...l, groups: [...l.groups, group] })),
    onSettled: cache.invalidate,
  });
}

/** 그룹 이름 바꾸기 — 화면 먼저, 실패하면 되돌린다 */
export function useRenamePackGroup(tripId: string) {
  const cache = usePackCache(tripId);
  /** 그 그룹 이름만 바꾼다 */
  const setName = (id: string, name: string) =>
    cache.set((l) => ({ ...l, groups: l.groups.map((g) => (g.id === id ? { ...g, name } : g)) }));
  return useMutation({
    mutationFn: (v: { id: string; name: string }) => renamePackGroup(v.id, v.name),
    onMutate: async (v) => {
      await cache.cancel();
      const before = cache.get()?.groups.find((g) => g.id === v.id)?.name ?? null;
      setName(v.id, v.name.trim());
      return { before };
    },
    onError: (_e, v, ctx) => {
      if (ctx?.before) setName(v.id, ctx.before);
    },
    onSettled: cache.invalidate,
  });
}

/** 그룹 지우기(항목도 함께) */
export function useDeletePackGroup(tripId: string) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (id: string) => deletePackGroup(id),
    onSettled: cache.invalidate,
  });
}

/** 항목 추가 — 그룹 맨 뒤에. 저장되면 바로 목록에 넣는다 */
export function useAddPackItem(tripId: string) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (v: { groupId: string; name: string }) => {
      const items = (cache.get()?.items ?? []).filter((i) => i.group_id === v.groupId);
      return addPackItem(tripId, v.groupId, v.name, nextPosition(items));
    },
    onSuccess: (item) => cache.set((l) => ({ ...l, items: [...l.items, item] })),
    onSettled: cache.invalidate,
  });
}

/** 챙김 바꾸기 — 화면 먼저(체크한 사람 · 시각), 실패하면 그 항목만 되돌린다 */
export function useSetPackChecked(tripId: string) {
  const cache = usePackCache(tripId);
  /** 그 항목의 챙김 칸만 바꾼다 */
  const setChecked = (id: string, checked_by: string | null, checked_at: string | null) =>
    cache.set((l) => ({
      ...l,
      items: l.items.map((i) => (i.id === id ? { ...i, checked_by, checked_at } : i)),
    }));
  return useMutation({
    mutationFn: (v: { id: string; checkedBy: string | null }) =>
      setPackItemChecked(v.id, v.checkedBy),
    onMutate: async (v) => {
      await cache.cancel();
      const before = cache.get()?.items.find((i) => i.id === v.id);
      setChecked(v.id, v.checkedBy, v.checkedBy ? new Date().toISOString() : null);
      return { before };
    },
    onError: (_e, v, ctx) => {
      if (ctx?.before) setChecked(v.id, ctx.before.checked_by, ctx.before.checked_at);
    },
    onSettled: cache.invalidate,
  });
}

/** 「기본 목록으로 시작」 — 그룹 · 항목을 한 번에 */
export function useAddPackPresets(tripId: string, kind: PackKind) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (presets: PackPreset[]) => addPackPresets(tripId, kind, presets),
    onSettled: cache.invalidate,
  });
}
