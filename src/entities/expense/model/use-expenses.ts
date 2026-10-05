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

export function useUpdateExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      values,
      previousCurrency,
    }: {
      expenseId: string;
      values: ExpenseFormValues;
      previousCurrency: string;
    }) => updateExpense(expenseId, values, previousCurrency),
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
