"use client";

import { useState } from "react";

import {
  type ExpensePeriod,
  expenseSections,
  sumExpenses,
  useExpenses,
  useMarkExpensePaid,
} from "@/entities/expense";
import { itemName, useAlternatives, useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";
import type { ToastMessage } from "@/shared/ui/toast";

import { expenseRowView } from "../lib/row";

/**
 * 가계부 목록 화면의 데이터 — 기간 필터, 묶음(여행준비 · day N)과 줄 글, 총합계.
 * 연결 일정 이름은 타임라인 일정과 대체 장소 줄에서 함께 찾는다(바꾸기로 대체 장소가 된 일정도 이름이 보이게)
 */
export function useExpenseList(tripId: string) {
  const tripQuery = useTrip(tripId);
  const trip = tripQuery.data;
  const { data: members = [] } = useTripMembers(tripId);
  const { data: user } = useUser();
  const expensesQuery = useExpenses(tripId);
  const { data: expenses, isPending } = expensesQuery;
  const { data: items = [] } = useScheduleItems(tripId);
  const { data: alternatives = [] } = useAlternatives(tripId);
  const markPaid = useMarkExpensePaid(tripId);
  const [filter, setFilter] = useState<ExpensePeriod | "all">("all");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /** 사람 이름 — 나는 「나」 */
  function nameOf(userId: string) {
    if (userId === user?.id) return "나";
    return members.find((m) => m.user_id === userId)?.profile.display_name ?? "알 수 없음";
  }

  /** 아바타 사진 — 없으면 null(이니셜) */
  function avatarOf(userId: string) {
    return members.find((m) => m.user_id === userId)?.profile.avatar_url ?? null;
  }

  /** 연결 일정 이름 */
  function linkNameOf(itemId: string) {
    const item = items.find((i) => i.id === itemId) ?? alternatives.find((i) => i.id === itemId);
    return item ? itemName(item) : null;
  }

  if (!trip || !expenses) {
    return {
      ready: false as const,
      // 읽기에 실패했다 — 로딩과 구분해 안내 · 다시 시도를 보인다(오프라인 · 권한)
      failed: tripQuery.isError || expensesQuery.isError,
      retry: () => {
        void tripQuery.refetch();
        void expensesQuery.refetch();
      },
    };
  }

  const ctx = {
    home: trip.home_currency,
    rates: trip.exchange_rates,
    today: todayISO(),
    nameOf,
    linkNameOf,
  };
  const sections = expenseSections(expenses, trip, filter).map((s) => ({
    ...s,
    rows: s.expenses.map((e) => expenseRowView(e, ctx)),
  }));
  return {
    trip,
    isPending,
    ready: true as const,
    filter,
    setFilter,
    sections,
    count: expenses.length,
    total: sumExpenses(expenses, trip.home_currency, trip.exchange_rates),
    /** 「결제 완료로」 — 실패하면 토스트로 알린다 */
    markPaid: (expenseId: string) =>
      markPaid.mutate(expenseId, {
        onError: () => setToast({ text: "결제 완료로 바꾸지 못했어요", id: Date.now() }),
      }),
    /** 결제 완료로 바꾸는 중인 지출 — 그 줄의 버튼을 막는다 */
    paying: markPaid.isPending ? markPaid.variables : null,
    toast,
    clearToast: () => setToast(null),
    avatarOf,
  };
}

export type ExpenseList = Extract<ReturnType<typeof useExpenseList>, { ready: true }>;
export type ExpenseListSection = ExpenseList["sections"][number];
