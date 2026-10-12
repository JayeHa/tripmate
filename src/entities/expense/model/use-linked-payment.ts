"use client";

import { todayISO } from "@/shared/lib/days";

import { paymentView } from "../lib/payment-view";
import { payerOf, type PersonRef } from "../lib/person";
import type { Expense } from "./types";
import { useExpenses, useMarkExpensePaid } from "./use-expenses";

/**
 * 숙소 · 항공편의 결제 — 가계부에서 그것에 붙은 비용(match)을 찾아 요약한다.
 * 가계부를 아직 못 읽었으면 loaded 가 false — 그동안 「+ 결제 추가」 를 보이지 않는다(이미 있는 결제를 하나 더 만들지 않게)
 */
export function useLinkedPayment(
  tripId: string,
  match: (e: Expense) => boolean,
  payerName: (payer: PersonRef | null) => string,
) {
  const { data: expenses } = useExpenses(tripId);
  const markPaid = useMarkExpensePaid(tripId);
  const expense = expenses?.find(match) ?? null;

  return {
    loaded: expenses !== undefined,
    /** 붙어 있는 비용 — 없으면 null(「+ 결제 추가」) */
    expenseId: expense?.id ?? null,
    view: expense && paymentView(expense, payerName(payerOf(expense)), todayISO()),
    /** 「결제 완료로」 — 예정일이 지난 결제 */
    markPaid: () => {
      if (expense) markPaid.mutate(expense.id);
    },
    marking: markPaid.isPending,
    markError: markPaid.error?.message ?? null,
  };
}

export type LinkedPaymentState = ReturnType<typeof useLinkedPayment>;
