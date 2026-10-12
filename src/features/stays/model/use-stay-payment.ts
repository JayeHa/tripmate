"use client";

import { payerOf, useExpenses, useMarkExpensePaid, useTripGuests } from "@/entities/expense";
import { useMemberLookup } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";

import { stayPaymentView } from "../lib/stay-payment";

/**
 * 숙소의 결제 — 가계부에서 이 숙소에 붙은 비용(`stay_id`)을 찾아 요약한다.
 * 가계부를 아직 못 읽었으면 loaded 가 false — 그동안 「+ 결제 추가」 를 보이지 않는다(이미 있는 결제를 하나 더 만들지 않게)
 */
export function useStayPayment(tripId: string, stayId: string) {
  const { data: expenses } = useExpenses(tripId);
  const { data: guests = [] } = useTripGuests(tripId);
  const member = useMemberLookup(tripId);
  const markPaid = useMarkExpensePaid(tripId);
  const expense = expenses?.find((e) => e.stay_id === stayId) ?? null;

  /** 결제한 사람 이름 — 멤버는 표시 이름, 정산 인원은 그 이름 */
  function payerName(): string {
    const payer = expense && payerOf(expense);
    if (!payer) return "";
    if (payer.kind === "guest") return guests.find((g) => g.id === payer.id)?.name ?? "알 수 없음";
    return member(payer.id)?.name ?? "알 수 없음";
  }

  return {
    loaded: expenses !== undefined,
    view: expense && stayPaymentView(expense, payerName(), todayISO()),
    /** 「결제 완료로」 — 예정일이 지난 결제 */
    markPaid: () => {
      if (expense) markPaid.mutate(expense.id);
    },
    marking: markPaid.isPending,
    markError: markPaid.error?.message ?? null,
  };
}

export type StayPaymentState = ReturnType<typeof useStayPayment>;
