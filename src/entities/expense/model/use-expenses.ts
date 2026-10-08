"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  markExpensePaid,
  updateExpense,
} from "../api/expenses";
import {
  fetchReceipts,
  fetchReceiptUrls,
  type ReceiptChange,
  syncReceipts,
  type UploadedReceipt,
} from "../api/receipts";
import { LINK_GONE } from "../lib/link-gone";
import type { ExpenseFormValues } from "./schema";

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: queryKeys.expenses(tripId),
    queryFn: () => fetchExpenses(tripId),
  });
}

export function useCreateExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      createdBy,
      receipts,
    }: {
      values: ExpenseFormValues;
      createdBy: string;
      /** 이미 저장소에 올린 영수증 — 지출과 함께 붙인다 */
      receipts?: UploadedReceipt[];
    }) => createExpense(tripId, values, createdBy, receipts),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.receipts(tripId) });
      return qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) });
    },
    onError: (error) => refetchItemsIfLinkGone(qc, tripId, error),
  });
}

/**
 * 연결 일정이 지워져 저장이 막혔으면 일정 목록을 다시 읽는다 — 폼이 그 일정이 사라진 것을 알아채 연결을 풀고(#161),
 * 다시 저장하면 연결 없이 들어간다
 */
function refetchItemsIfLinkGone(
  qc: ReturnType<typeof useQueryClient>,
  tripId: string,
  error: Error,
) {
  if (error.message === LINK_GONE)
    void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
}

/** 지출 고치기 — `opened` 는 수정 폼을 연 때의 값(그때와 달라진 칸만 보낸다) */
export function useUpdateExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      values,
      opened,
      receipts,
    }: {
      expenseId: string;
      values: ExpenseFormValues;
      opened: ExpenseFormValues;
      /** 붙일 영수증 · 뗄 영수증 */
      receipts?: ReceiptChange;
    }) => {
      await updateExpense(expenseId, values, opened);
      if (receipts) await syncReceipts(tripId, expenseId, receipts);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.receipts(tripId) });
      return qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) });
    },
    onError: (error) => refetchItemsIfLinkGone(qc, tripId, error),
  });
}

/** 결제 예정을 결제 완료로(목록의 「예정일 지남 · 결제 완료로」) */
export function useMarkExpensePaid(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markExpensePaid,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
  });
}

export function useDeleteExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(tripId, expenseId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.receipts(tripId) });
      return qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) });
    },
  });
}

/** 여행의 영수증 줄(지출마다 몇 장 · 어떤 파일) */
export function useTripReceipts(tripId: string) {
  return useQuery({
    queryKey: queryKeys.receipts(tripId),
    queryFn: () => fetchReceipts(tripId),
  });
}

/** 읽기 주소가 1시간 유효해서, 그보다 조금 짧게만 쓰고 그 전에 새로 받는다 */
const URL_STALE_MS = 50 * 60 * 1000;

/** 영수증 파일을 볼 주소 — 키 목록이 같으면 다시 받지 않는다. 기기에는 저장하지 않는다(`shouldPersistQuery`, 주소가 만료된다) */
export function useReceiptUrls(tripId: string, keys: string[]) {
  return useQuery({
    queryKey: [...queryKeys.receipts(tripId), "urls", ...keys],
    queryFn: () => fetchReceiptUrls(tripId, keys),
    enabled: keys.length > 0,
    staleTime: URL_STALE_MS,
    gcTime: URL_STALE_MS,
    // 화면을 오래 띄워 둬도(포커스 · 다시 마운트 없이) 만료 전에 새 주소로 바꾼다
    refetchInterval: URL_STALE_MS,
  });
}
