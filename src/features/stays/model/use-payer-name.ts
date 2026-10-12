"use client";

import { type PersonRef, useTripGuests } from "@/entities/expense";
import { useMemberLookup } from "@/entities/trip-member";

/** 결제한 사람 이름을 찾는 함수 — 멤버는 표시 이름, 정산 인원은 그 이름, 없으면 "" */
export function usePayerName(tripId: string) {
  const { data: guests = [] } = useTripGuests(tripId);
  const member = useMemberLookup(tripId);
  return (payer: PersonRef | null): string => {
    if (!payer) return "";
    if (payer.kind === "guest") return guests.find((g) => g.id === payer.id)?.name ?? "알 수 없음";
    return member(payer.id)?.name ?? "알 수 없음";
  };
}
