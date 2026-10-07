"use client";

import { useState } from "react";

import {
  computeNetBalances,
  expenseRowView,
  expenseSections,
  type ExpenseWithSplits,
  peopleOf,
  personKey,
  type PersonRef,
  sumExpenses,
  useExpenses,
  useMarkExpensePaid,
  useTripGuests,
} from "@/entities/expense";
import { itemName, useAlternatives, useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";
import { type ExchangeRates, MissingRateError } from "@/shared/lib/money";
import type { ToastMessage } from "@/shared/ui/toast";

/** 내가 쓴 돈(내 몫의 합, 기준 화폐). 환율이 없는 비용이 있으면 null — 틀린 합을 보이지 않는다 */
function spentBy(
  me: PersonRef,
  people: PersonRef[],
  expenses: ExpenseWithSplits[],
  home: string,
  rates: ExchangeRates,
): number | null {
  try {
    return computeNetBalances(expenses, people, home, rates).spent[personKey(me)] ?? 0;
  } catch (e) {
    if (e instanceof MissingRateError) return null;
    throw e;
  }
}

/**
 * 가계부 목록 화면의 데이터 — 묶음(여행준비 · day N)과 줄 글, 총합계 · 내가 쓴 돈. PC 는 필터로 거른 묶음을 sectionsOf 로 만든다.
 * 연결 일정 이름은 타임라인 일정과 대체 장소 줄에서 함께 찾는다(바꾸기로 대체 장소가 된 일정도 이름이 보이게)
 */
export function useExpenseList(tripId: string) {
  const tripQuery = useTrip(tripId);
  const trip = tripQuery.data;
  const { data: members = [] } = useTripMembers(tripId);
  const { data: user } = useUser();
  const expensesQuery = useExpenses(tripId);
  const { data: expenses, isPending } = expensesQuery;
  const { data: guests = [] } = useTripGuests(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  const { data: alternatives = [] } = useAlternatives(tripId);
  const markPaid = useMarkExpensePaid(tripId);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /** 사람 이름 — 나는 「나」. 정산 인원은 이름만 있다 */
  function nameOf(person: PersonRef) {
    if (person.kind === "guest")
      return guests.find((g) => g.id === person.id)?.name ?? "알 수 없음";
    if (person.id === user?.id) return "나";
    return members.find((m) => m.user_id === person.id)?.profile.display_name ?? "알 수 없음";
  }

  /** 아바타 — 사진(없으면 null)과 이니셜에 쓸 표시 이름. 나도 「나」 가 아니라 내 이름 */
  function avatarOf(person: PersonRef) {
    if (person.kind === "guest") {
      return { name: guests.find((g) => g.id === person.id)?.name ?? "", url: null };
    }
    const profile = members.find((m) => m.user_id === person.id)?.profile;
    return { name: profile?.display_name ?? "", url: profile?.avatar_url ?? null };
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
  const people = peopleOf(
    members.map((m) => m.user_id),
    guests,
  );
  const me: PersonRef | null = user ? { kind: "member", id: user.id } : null;
  /** 묶음(여행준비 · day N, 비용 없는 날도)과 줄 글. 거르는 조건을 주면 맞는 비용만(PC 필터) */
  const sectionsOf = (keep?: (e: ExpenseWithSplits) => boolean) =>
    expenseSections(keep ? expenses.filter(keep) : expenses, trip).map((s) => ({
      ...s,
      rows: s.expenses.map((e) => expenseRowView(e, ctx)),
    }));
  const allSections = sectionsOf();
  return {
    trip,
    isPending,
    ready: true as const,
    expenses,
    allSections,
    sectionsOf,
    count: expenses.length,
    total: sumExpenses(expenses, trip.home_currency, trip.exchange_rates),
    /** 혼자 쓰는 가계부(사람이 나뿐) — 「내가 쓴 돈」 · 정산을 보이지 않는다 */
    solo: people.length <= 1,
    /** 여행의 사람(멤버 + 정산 인원) — PC 「결제한 사람」 필터 */
    people,
    /** 여행의 사람 수 — 「N명 모두」 를 가린다 */
    everyone: people.length,
    /** 나 — PC 상세의 「정원 (나)」. 아직 모르면 null */
    meId: me?.id ?? null,
    /** 내가 쓴 돈. 아직 나를 모르거나 환율이 없으면 null */
    mySpent: me ? spentBy(me, people, expenses, trip.home_currency, trip.exchange_rates) : null,
    /** 표시 이름 — 목록의 「나」 가 아니라 내 이름(「정원 결제」) */
    displayNameOf: (person: PersonRef) => avatarOf(person).name || nameOf(person),
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
export type ExpenseListSection = ExpenseList["allSections"][number];
