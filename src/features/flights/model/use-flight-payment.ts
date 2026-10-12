"use client";

import { useLinkedPayment, usePayerName } from "@/entities/expense";
import { useMemberLookup } from "@/entities/trip-member";

/** 항공편의 결제 — 가계부에서 이 항공편에 붙은 비용(`flight_id`)을 찾아 요약한다(useLinkedPayment) */
export function useFlightPayment(tripId: string, flightId: string) {
  const payerName = usePayerName(tripId, useMemberLookup(tripId));
  return useLinkedPayment(tripId, (e) => e.flight_id === flightId, payerName);
}
