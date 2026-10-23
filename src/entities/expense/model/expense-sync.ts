import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import {
  dropFailedTwins,
  isNetworkError,
  retrySync,
  SYNC_KEY,
  SYNC_SCOPE,
} from "@/shared/api/sync";

import { createExpenseOnce } from "../api/expense-queue";
import { LINK_GONE } from "../lib/link-gone";
import { optimisticExpense } from "../lib/optimistic-expense";
import { resolveShares } from "../lib/shares";
import type { ExpenseFormValues } from "./schema";
import type { ExpenseWithSplits } from "./types";

/** 비용 추가(영수증 없는 보통 비용) — 오프라인 대기열(SYNC_KEY) */
export const EXPENSE_CREATE_KEY = [SYNC_KEY, "expense-create"] as const;

/** 비용 추가의 값 — 기기에 남아 되살아나므로 폼 값 전부와 만든 사람 · 누른 때를 담는다. id 는 화면에서 만든다(두 번 올라가도 하나) */
export type ExpenseCreateVars = {
  tripId: string;
  id: string;
  values: ExpenseFormValues;
  createdBy: string;
  createdAt: string;
};

/**
 * 비용 추가의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 목록에 먼저 넣고 올린다. 실패하면 — 연결 일정이 지워졌거나 권한이 없으면 그 줄만 빼고, 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남긴다
 */
export function registerExpenseSync(qc: QueryClient): void {
  /** 캐시의 지출 목록을 바꾼다(아직 읽지 않았으면 그대로) */
  const setExpenses = (
    tripId: string,
    change: (list: ExpenseWithSplits[]) => ExpenseWithSplits[],
  ) =>
    qc.setQueryData<ExpenseWithSplits[]>(
      queryKeys.expenses(tripId),
      (list) => list && change(list),
    );
  qc.setMutationDefaults(EXPENSE_CREATE_KEY, {
    scope: SYNC_SCOPE,
    retry: retrySync,
    gcTime: Infinity,
    mutationFn: (v: ExpenseCreateVars) => createExpenseOnce(v),
    onMutate: async (v: ExpenseCreateVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.expenses(v.tripId) });
      const row = optimisticExpense(v, resolveShares(v.values));
      // 같은 창에서 다시 저장했으면(같은 id) 앞서 실패한 저장을 빼고 그 줄을 바꿔 끼운다 — 두 줄로 보이지 않게
      dropFailedTwins(qc, EXPENSE_CREATE_KEY, v.id);
      setExpenses(v.tripId, (list) => [row, ...list.filter((e) => e.id !== v.id)]);
    },
    onError: (error: Error, v: ExpenseCreateVars) => {
      if (isNetworkError(error)) return;
      setExpenses(v.tripId, (list) => list.filter((e) => e.id !== v.id));
      // 연결 일정이 지워져 막혔으면 일정 목록도 다시 읽는다 — 다시 열면 연결 없이 저장할 수 있게(#161)
      if (error.message === LINK_GONE) {
        void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(v.tripId) });
      }
    },
    onSettled: (_d, error, v: ExpenseCreateVars) => {
      if (error && isNetworkError(error)) return;
      if (qc.isMutating({ mutationKey: EXPENSE_CREATE_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.expenses(v.tripId) });
      }
    },
  });
}
