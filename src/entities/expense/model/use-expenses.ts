"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, deleteExpense, fetchExpenses, updateExpense } from "@/lib/queries/expenses";
import { queryKeys } from "@/lib/queries/keys";
import type { ExpenseFormValues } from "@/lib/schemas/expense";

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
    mutationFn: ({ expenseId, values }: { expenseId: string; values: ExpenseFormValues }) =>
      updateExpense(expenseId, values),
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
