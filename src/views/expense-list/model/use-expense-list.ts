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

import { expenseRowView } from "../lib/row";

/**
 * 가계부 목록 화면의 데이터 — 기간 필터, 묶음(여행준비 · day N)과 줄 글, 총합계.
 * 연결 일정 이름은 타임라인 일정과 대체 장소 줄에서 함께 찾는다(바꾸기로 대체 장소가 된 일정도 이름이 보이게)
 */
export function useExpenseList(tripId: string) {
  const { data: trip } = useTrip(tripId);
  const { data: members = [] } = useTripMembers(tripId);
  const { data: user } = useUser();
  const { data: expenses, isPending } = useExpenses(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  const { data: alternatives = [] } = useAlternatives(tripId);
  const markPaid = useMarkExpensePaid(tripId);
  const [filter, setFilter] = useState<ExpensePeriod | "all">("all");

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

  if (!trip || !expenses) return { trip, isPending, ready: false as const };

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
    markPaid: (expenseId: string) => markPaid.mutate(expenseId),
    avatarOf,
  };
}

export type ExpenseList = Extract<ReturnType<typeof useExpenseList>, { ready: true }>;
export type ExpenseListSection = ExpenseList["sections"][number];
