"use client";

import {
  expenseRowView,
  type PersonRef,
  useExpenses,
  useTripGuests,
  useTripReceipts,
} from "@/entities/expense";
import { itemName, useAlternatives, useScheduleItems } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";

/**
 * 비용 상세 화면의 데이터 — 여행 · 그 지출 · 줄 글(금액 · 결제한 사람 · 함께한 사람 · 결제수단 · 연결 일정) · 사람의 프로필 사진.
 * 이름은 표시 이름 그대로(나도 「나」 가 아니라 내 이름). 연결 일정 이름은 타임라인 일정과 대체 장소 줄에서 찾는다 —
 * 일정을 아직 못 읽었으면 그 칸만 늦게 보인다.
 * 지출 목록을 읽었는데 그 id 가 없으면 `missing`(지워졌거나 다른 여행의 지출). 기기에 저장된 값 없이 읽기가 실패했을 때만 `failed`
 */
export function useExpenseDetail(tripId: string, expenseId: string) {
  const tripQuery = useTrip(tripId);
  const expensesQuery = useExpenses(tripId);
  const { data: members = [] } = useTripMembers(tripId);
  const { data: guests = [] } = useTripGuests(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  const { data: alternatives = [] } = useAlternatives(tripId);
  const { data: tripReceipts = [] } = useTripReceipts(tripId);
  const trip = tripQuery.data;
  const expenses = expensesQuery.data;
  const retry = () => {
    void tripQuery.refetch();
    void expensesQuery.refetch();
  };

  if (!trip || !expenses) {
    const failed = tripQuery.isError || expensesQuery.isError;
    return { state: failed ? ("failed" as const) : ("loading" as const), retry };
  }
  const expense = expenses.find((e) => e.id === expenseId);
  if (!expense) return { state: "missing" as const, retry };

  /** 표시 이름 — 정산 인원은 이름만 있다 */
  function nameOf(person: PersonRef) {
    if (person.kind === "guest")
      return guests.find((g) => g.id === person.id)?.name ?? "알 수 없음";
    return members.find((m) => m.user_id === person.id)?.profile.display_name ?? "알 수 없음";
  }

  /** 프로필 사진 — 정산 인원 · 사진이 없으면 null(첫 글자) */
  function avatarUrlOf(person: PersonRef) {
    if (person.kind === "guest") return null;
    return members.find((m) => m.user_id === person.id)?.profile.avatar_url ?? null;
  }

  /** 연결 일정 이름 */
  function linkNameOf(itemId: string) {
    const item = items.find((i) => i.id === itemId) ?? alternatives.find((i) => i.id === itemId);
    return item ? itemName(item) : null;
  }

  const row = expenseRowView(expense, {
    home: trip.home_currency,
    rates: trip.exchange_rates,
    today: todayISO(),
    nameOf,
    linkNameOf,
  });
  const receipts = tripReceipts.filter((r) => r.expense_id === expenseId);
  return { state: "ready" as const, trip, expense, row, receipts, avatarUrlOf, retry };
}
