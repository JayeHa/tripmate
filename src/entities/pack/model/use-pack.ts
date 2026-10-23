"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import type { SyncResult } from "@/shared/api/sync";

import {
  addPackGroup,
  addPackItem,
  addPackPresets,
  deletePackGroup,
  fetchPackLists,
  PACK_GONE,
  renamePackGroup,
} from "../api/pack";
import { nextPosition } from "../lib/board";
import { usePackCache } from "./pack-cache";
import { PACK_CHECKED_KEY, type PackCheckedVars } from "./pack-sync";
import type { PackKind, PackPreset } from "./types";

/** 여행의 준비물 · 쇼핑(두 종류 함께) */
export function usePackLists(tripId: string) {
  return useQuery({
    queryKey: queryKeys.packLists(tripId),
    queryFn: () => fetchPackLists(tripId),
  });
}

/**
 * 저장된 행을 맨 뒤에 — 이미 있으면 그대로. 앞 요청의 다시 읽기 · 실시간 다시 읽기가 이 응답보다 먼저 끝나
 * 캐시에 벌써 들어와 있을 수 있다(같은 줄이 둘 보이지 않게)
 */
function appendNew<T extends { id: string }>(rows: T[], row: T): T[] {
  return rows.some((r) => r.id === row.id) ? rows : [...rows, row];
}

/** 그룹 추가 — 맨 뒤에. 저장되면 바로 목록에 넣는다 */
export function useAddPackGroup(tripId: string, kind: PackKind) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (name: string) => {
      const groups = (cache.get()?.groups ?? []).filter((g) => g.kind === kind);
      return addPackGroup(tripId, kind, name, nextPosition(groups));
    },
    onSuccess: (group) => cache.set((l) => ({ ...l, groups: appendNew(l.groups, group) })),
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
    mutationFn: (id: string) => deletePackGroup(tripId, id),
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
    onSuccess: (item) => cache.set((l) => ({ ...l, items: appendNew(l.items, item) })),
    onSettled: cache.invalidate,
  });
}

/**
 * 챙김 바꾸기 — 오프라인에서도 되는 저장(대기열). 함수 · 화면 먼저 바꾸기 · 되돌리기는 `registerPackSync` 에 있다.
 * 누를 때 본 항목의 버전과 누른 시각을 함께 보낸다. 오프라인이면 연결되어 올라갈 때까지 끝나지 않는다
 */
export function useSetPackChecked(tripId: string) {
  const cache = usePackCache(tripId);
  const mutation = useMutation<SyncResult, Error, PackCheckedVars>({
    mutationKey: PACK_CHECKED_KEY,
  });
  return {
    mutateAsync: async (v: { id: string; checkedBy: string | null }) => {
      const item = cache.get()?.items.find((i) => i.id === v.id);
      if (!item) throw new Error(PACK_GONE);
      return mutation.mutateAsync({
        tripId,
        ...v,
        checkedAt: v.checkedBy ? new Date().toISOString() : null,
        version: item.updated_at,
      });
    },
  };
}

/** 「기본 목록으로 시작」 — 그룹 · 항목을 한 번에 */
export function useAddPackPresets(tripId: string, kind: PackKind) {
  const cache = usePackCache(tripId);
  return useMutation({
    mutationFn: (presets: PackPreset[]) => addPackPresets(tripId, kind, presets),
    onSettled: cache.invalidate,
  });
}
