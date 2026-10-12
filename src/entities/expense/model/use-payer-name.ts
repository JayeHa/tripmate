"use client";

import type { PersonRef } from "../lib/person";
import { useTripGuests } from "./use-trip-guests";

/**
 * 결제한 사람 이름을 찾는 함수 — 멤버는 표시 이름, 정산 인원은 그 이름, 없으면 "".
 * 멤버 이름은 다른 도메인(여행 멤버)이라 부르는 쪽이 찾는 함수를 넘긴다(`useMemberLookup(tripId)`)
 */
export function usePayerName(
  tripId: string,
  memberOf: (id: string) => { name: string } | null | undefined,
) {
  const { data: guests = [] } = useTripGuests(tripId);
  return (payer: PersonRef | null): string => {
    if (!payer) return "";
    if (payer.kind === "guest") return guests.find((g) => g.id === payer.id)?.name ?? "알 수 없음";
    return memberOf(payer.id)?.name ?? "알 수 없음";
  };
}
