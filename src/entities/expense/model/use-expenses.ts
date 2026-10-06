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
    mutationFn: ({ values, createdBy }: { values: ExpenseFormValues; createdBy: string }) =>
      createExpense(tripId, values, createdBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
  });
}

/** 지출 고치기 — `opened` 는 수정 폼을 연 때의 값(그때와 달라진 칸만 보낸다) */
export function useUpdateExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      values,
      opened,
    }: {
      expenseId: string;
      values: ExpenseFormValues;
      opened: ExpenseFormValues;
    }) => updateExpense(expenseId, values, opened),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
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
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
  });
}
