import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import {
  isNetworkError,
  notifySync,
  OVERWROTE_TEXT,
  rememberOwnWrite,
  SYNC_KEY,
  SYNC_SCOPE,
  type SyncResult,
  versionToCompare,
} from "@/shared/api/sync";

import { setChecklistStatus } from "../api/checklist";
import type { ChecklistItem, ChecklistStatus } from "./types";

/** 체크 저장 — 오프라인 대기열(SYNC_KEY) */
export const CHECKLIST_STATUS_KEY = [SYNC_KEY, "checklist-status"] as const;

/** 체크 저장의 값 — 기기에 남아 되살아나므로 여행 id 와 본 버전까지 담는다 */
export type ChecklistStatusVars = {
  tripId: string;
  id: string;
  status: ChecklistStatus;
  /** 누를 때 본 그 항목의 updated_at */
  version: string;
};

/**
 * 체크 저장의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 화면을 먼저 바꾸고(묶음이 바로 옮겨지게) 올린다. 그사이 일행이 고쳤으면 내 것으로 덮고 알린다(나중 수정 우선).
 * 실패하면 — 지워졌거나 권한이 없으면 그 항목만 되돌리고, 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남긴다.
 * 다시 읽기는 진행 중인 체크가 다 끝났을 때 한 번만 한다(중간에 읽으면 아직 올라가지 않은 다른 체크가 잠깐 풀린다)
 */
export function registerChecklistSync(qc: QueryClient): void {
  /** 캐시의 그 항목만 바꾼다 */
  const patchItem = (tripId: string, id: string, patch: Partial<ChecklistItem>) =>
    qc.setQueryData<ChecklistItem[]>(queryKeys.checklist(tripId), (items) =>
      items?.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  qc.setMutationDefaults(CHECKLIST_STATUS_KEY, {
    scope: SYNC_SCOPE,
    retry: 3,
    // 실패한 저장이 5분 뒤 사라지면 「저장 실패 · 다시 시도」 도 함께 사라져 변경을 잃는다 — 다시 시도할 때 지운다
    gcTime: Infinity,
    mutationFn: async (v: ChecklistStatusVars): Promise<SyncResult> => {
      const result = await setChecklistStatus(v.id, v.status, versionToCompare(v.id, v.version));
      rememberOwnWrite(v.id, v.version, result.updatedAt);
      return result;
    },
    onMutate: async (v: ChecklistStatusVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.checklist(v.tripId) });
      const before = qc
        .getQueryData<ChecklistItem[]>(queryKeys.checklist(v.tripId))
        ?.find((i) => i.id === v.id)?.status;
      patchItem(v.tripId, v.id, { status: v.status });
      return { before };
    },
    onSuccess: (result: SyncResult, v: ChecklistStatusVars) => {
      patchItem(v.tripId, v.id, { updated_at: result.updatedAt });
      if (result.overwrote) notifySync(OVERWROTE_TEXT);
    },
    onError: (error, v: ChecklistStatusVars, ctx: { before?: string } | undefined) => {
      if (!isNetworkError(error) && ctx?.before) patchItem(v.tripId, v.id, { status: ctx.before });
    },
    onSettled: (_d, error, v: ChecklistStatusVars) => {
      // 서버에 닿지 못해 실패했으면 다시 읽지 않는다 — 읽기만 되면 내 체크가 서버 값으로 풀려 보인다(「다시 시도」 로 올린다)
      if (error && isNetworkError(error)) return;
      if (qc.isMutating({ mutationKey: CHECKLIST_STATUS_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.checklist(v.tripId) });
      }
    },
  });
}
