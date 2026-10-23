import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import {
  isNetworkError,
  notifySync,
  OVERWROTE_TEXT,
  rememberOwnWrite,
  retrySync,
  SYNC_KEY,
  SYNC_SCOPE,
  type SyncResult,
  versionToCompare,
} from "@/shared/api/sync";

import { setPackItemChecked } from "../api/pack";
import type { PackItem, PackLists } from "./types";

/** 챙김 저장 — 오프라인 대기열(SYNC_KEY). 준비물 · 쇼핑 함께 */
export const PACK_CHECKED_KEY = [SYNC_KEY, "pack-checked"] as const;

/** 챙김 저장의 값 — 기기에 남아 되살아나므로 여행 id · 누른 시각 · 본 버전까지 담는다 */
export type PackCheckedVars = {
  tripId: string;
  id: string;
  /** 챙긴 사람(나), 풀면 null */
  checkedBy: string | null;
  /** 누른 시각(오프라인에서 챙긴 때), 풀면 null */
  checkedAt: string | null;
  /** 누를 때 본 그 항목의 updated_at */
  version: string;
};

/**
 * 챙김 저장의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 화면을 먼저 바꾸고 올린다. 그사이 일행이 고쳤으면 내 것으로 덮고 알린다(나중 수정 우선).
 * 실패하면 — 지워졌거나 권한이 없으면 그 항목만 되돌리고, 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남긴다
 */
export function registerPackSync(qc: QueryClient): void {
  /** 캐시의 그 항목만 바꾼다 */
  const patchItem = (tripId: string, id: string, patch: Partial<PackItem>) =>
    qc.setQueryData<PackLists>(queryKeys.packLists(tripId), (lists) =>
      lists
        ? { ...lists, items: lists.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }
        : lists,
    );
  qc.setMutationDefaults(PACK_CHECKED_KEY, {
    scope: SYNC_SCOPE,
    retry: retrySync,
    // 실패한 저장이 5분 뒤 사라지면 「저장 실패 · 다시 시도」 도 함께 사라져 변경을 잃는다 — 다시 시도할 때 지운다
    gcTime: Infinity,
    mutationFn: async (v: PackCheckedVars): Promise<SyncResult> => {
      const version = versionToCompare(v.id, v.version);
      const result = await setPackItemChecked(v.id, v.checkedBy, v.checkedAt, version);
      rememberOwnWrite(v.id, v.version, result.updatedAt);
      return result;
    },
    onMutate: async (v: PackCheckedVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.packLists(v.tripId), exact: true });
      const before = qc
        .getQueryData<PackLists>(queryKeys.packLists(v.tripId))
        ?.items.find((i) => i.id === v.id);
      patchItem(v.tripId, v.id, { checked_by: v.checkedBy, checked_at: v.checkedAt });
      return { before };
    },
    onSuccess: (result: SyncResult, v: PackCheckedVars) => {
      patchItem(v.tripId, v.id, { updated_at: result.updatedAt });
      if (result.overwrote) notifySync(OVERWROTE_TEXT);
    },
    onError: (error, v: PackCheckedVars, ctx: { before?: PackItem } | undefined) => {
      const before = ctx?.before;
      if (isNetworkError(error) || !before) return;
      patchItem(v.tripId, v.id, { checked_by: before.checked_by, checked_at: before.checked_at });
    },
    onSettled: (_d, error, v: PackCheckedVars) => {
      // 서버에 닿지 못해 실패했으면 다시 읽지 않는다 — 읽기만 되면 내 체크가 서버 값으로 풀려 보인다(「다시 시도」 로 올린다)
      if (error && isNetworkError(error)) return;
      if (qc.isMutating({ mutationKey: PACK_CHECKED_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.packLists(v.tripId), exact: true });
      }
    },
  });
}
