"use client";

import {
  peopleOf,
  type PersonKey,
  personKey,
  personOfKey,
  useExpenses,
  useSettlements,
  useTripGuests,
} from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import type { Trip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { useVouchers } from "@/entities/voucher";

import { postSettleBand, tripSummary } from "../lib/post-board";

/**
 * 여행 후 상태판 — 정산 띠(남은 정산이 있을 때만) · 여행 요약. 읽을 것이 하나라도 아직 오지 않았으면 null
 * (송금 기록을 읽기 전에 그리면 이미 보낸 돈을 빼지 않은 띠가 잠깐 보인다)
 */
export function usePostBoard(tripId: string, trip: Trip) {
  const expenses = useExpenses(tripId).data;
  const settlements = useSettlements(tripId).data;
  const items = useScheduleItems(tripId).data;
  const vouchers = useVouchers(tripId).data;
  const members = useTripMembers(tripId).data;
  const guests = useTripGuests(tripId).data;
  const userId = useUser().data?.id ?? null;
  if (!expenses || !settlements || !items || !vouchers || !members || !guests) return null;
  const people = peopleOf(
    members.map((m) => m.user_id),
    guests,
  );
  const ctx = { home: trip.home_currency, rates: trip.exchange_rates };
  /** 정산 띠의 사람 — 멤버는 프로필 이름 · 사진, 정산 인원은 이름만 */
  const personOf = (key: PersonKey) => {
    const person = personOfKey(key);
    if (person?.kind === "guest")
      return {
        name: guests.find((g) => g.id === person.id)?.name ?? "알 수 없음",
        avatarUrl: null,
      };
    const profile = members.find((m) => m.user_id === person?.id)?.profile;
    return { name: profile?.display_name ?? "알 수 없음", avatarUrl: profile?.avatar_url ?? null };
  };
  return {
    band:
      userId && people.length > 1
        ? postSettleBand(expenses, settlements, {
            ...ctx,
            people,
            me: personKey({ kind: "member", id: userId }),
          })
        : null,
    personOf,
    summary: tripSummary(
      { expenses, items, voucherCount: vouchers.length },
      { ...ctx, peopleCount: people.length },
    ),
  };
}

/** 여행 후 상태판에 그릴 것 */
export type PostBoard = NonNullable<ReturnType<typeof usePostBoard>>;
