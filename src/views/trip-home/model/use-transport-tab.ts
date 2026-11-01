"use client";

import { useState } from "react";

import { useExpenses } from "@/entities/expense";
import { useUser } from "@/entities/session";
import { fareTotals, useTransportFares } from "@/entities/transport-fare";
import type { Trip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { dayCount } from "@/shared/lib/days";
import { tripCurrencies } from "@/shared/lib/money";

import { homeApprox, startFareCurrency, totalsLabel } from "../lib/transport";
import { actualFares } from "../lib/transport-actual";
import type { FareTarget } from "./use-fare-form";

/**
 * 「교통」 탭 상태 — 교통비 줄 · 1인 합계(통화별 + 기준 통화 어림값 + 일행 수만큼) · 열린 편집 창,
 * 가계부 교통 비용의 내 몫(합계 · 날짜별 · 날짜 없음). 내 몫은 가계부를 불러오기 전이나 없으면 null.
 * 창은 한 번에 하나(교통비 줄 또는 교통카드 메모)
 */
export function useTransportTab(tripId: string, trip: Trip) {
  const fares = useTransportFares(tripId);
  const members = useTripMembers(tripId).data;
  const expenses = useExpenses(tripId).data;
  const userId = useUser().data?.id;
  const [editing, setEditing] = useState<FareTarget | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const totalDays = dayCount(trip.start_date, trip.end_date);
  const rows = fares.data ?? [];
  const totals = fareTotals(rows, totalDays);
  const people = members?.length ?? 1;
  const currencies = tripCurrencies(trip.home_currency, trip.exchange_rates);
  const actual =
    expenses && userId ? actualFares(expenses, userId, trip.start_date, totalDays) : null;
  const actualTotal = totalsLabel(actual?.total ?? []);
  return {
    loading: fares.isPending,
    fares: rows,
    totalDays,
    total: totalsLabel(totals),
    approx: homeApprox(totals, trip.home_currency, trip.exchange_rates),
    group: people > 1 ? { people, total: totalsLabel(totals, people) } : null,
    actual: actualTotal
      ? {
          total: actualTotal,
          approx: homeApprox(actual?.total ?? [], trip.home_currency, trip.exchange_rates),
        }
      : null,
    actualOf: (dayIndex: number) => totalsLabel(actual?.byDay.get(dayIndex) ?? []),
    undatedActual: totalsLabel(actual?.undated ?? []),
    currencies,
    startCurrency: startFareCurrency(currencies, rows),
    editing,
    setEditing,
    noteOpen,
    setNoteOpen,
  };
}
