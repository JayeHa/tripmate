"use client";

import { payerOf, useExpenses, useMarkExpensePaid } from "@/entities/expense";
import { todayISO } from "@/shared/lib/days";

import { stayPaymentView } from "../lib/stay-payment";
import { usePayerName } from "./use-payer-name";

/**
 * 숙소의 결제 — 가계부에서 이 숙소에 붙은 비용(`stay_id`)을 찾아 요약한다.
 * 가계부를 아직 못 읽었으면 loaded 가 false — 그동안 「+ 결제 추가」 를 보이지 않는다(이미 있는 결제를 하나 더 만들지 않게)
 */
export function useStayPayment(tripId: string, stayId: string) {
  const { data: expenses } = useExpenses(tripId);
  const payerName = usePayerName(tripId);
  const markPaid = useMarkExpensePaid(tripId);
  const expense = expenses?.find((e) => e.stay_id === stayId) ?? null;

  return {
    loaded: expenses !== undefined,
    /** 붙어 있는 비용 — 없으면 null(「+ 결제 추가」) */
    expenseId: expense?.id ?? null,
    view: expense && stayPaymentView(expense, payerName(payerOf(expense)), todayISO()),
    /** 「결제 완료로」 — 예정일이 지난 결제 */
    markPaid: () => {
      if (expense) markPaid.mutate(expense.id);
    },
    marking: markPaid.isPending,
    markError: markPaid.error?.message ?? null,
  };
}

export type StayPaymentState = ReturnType<typeof useStayPayment>;
