import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import { isNetworkError, retrySync, SYNC_KEY, SYNC_SCOPE } from "@/shared/api/sync";

import { saveVisit } from "../api/visits";
import type { Visit, VisitMark } from "./visit";

/** 다녀감 표시 저장 — 오프라인 대기열(SYNC_KEY) */
export const VISIT_KEY = [SYNC_KEY, "visit"] as const;

/** 표시 저장의 값 — 기기에 남아 되살아나므로 여행 id 와 누른 시각까지 담는다. mark 가 null 이면 지우기 */
export type VisitVars = {
  tripId: string;
  itemId: string;
  mark: VisitMark | null;
  /** 누른 시각(ISO) */
  at: string;
};

/**
 * 다녀감 표시 저장의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 화면을 먼저 바꾸고 올린다. 일정 id 가 키라 다시 올려도 같다 — 버전 비교 없이 나중에 올라간 쪽이 남는다(누르기 하나라 덮어도 잃을 것이 적다).
 * 실패하면 — 일정이 지워졌거나 권한이 없으면 다시 읽어 되돌리고, 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남긴다.
 * 다시 읽기는 진행 중인 표시 저장이 다 끝났을 때 한 번만 한다
 */
export function registerVisitSync(qc: QueryClient): void {
  qc.setMutationDefaults(VISIT_KEY, {
    scope: SYNC_SCOPE,
    retry: retrySync,
    // 실패한 저장이 5분 뒤 사라지면 「저장 실패 · 다시 시도」 도 함께 사라져 변경을 잃는다 — 다시 시도할 때 지운다
    gcTime: Infinity,
    mutationFn: (v: VisitVars) => saveVisit(v),
    onMutate: async (v: VisitVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.visits(v.tripId) });
      qc.setQueryData<Visit[]>(queryKeys.visits(v.tripId), (visits) => {
        if (!visits) return visits;
        const rest = visits.filter((x) => x.item_id !== v.itemId);
        if (!v.mark) return rest;
        return [
          ...rest,
          { item_id: v.itemId, trip_id: v.tripId, mark: v.mark, marked_at: v.at, marked_by: null },
        ];
      });
    },
    onSettled: (_d, error, v: VisitVars) => {
      // 서버에 닿지 못해 실패했으면 다시 읽지 않는다 — 읽기만 되면 내 표시가 서버 값으로 풀려 보인다(「다시 시도」 로 올린다)
      if (error && isNetworkError(error)) return;
      if (qc.isMutating({ mutationKey: VISIT_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.visits(v.tripId) });
      }
    },
  });
}
