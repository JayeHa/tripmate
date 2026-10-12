"use client";

import { useLinkedPayment, usePayerName } from "@/entities/expense";
import { useMemberLookup } from "@/entities/trip-member";

/** 숙소의 결제 — 가계부에서 이 숙소에 붙은 비용(`stay_id`)을 찾아 요약한다(useLinkedPayment) */
export function useStayPayment(tripId: string, stayId: string) {
  const payerName = usePayerName(tripId, useMemberLookup(tripId));
  return useLinkedPayment(tripId, (e) => e.stay_id === stayId, payerName);
}
