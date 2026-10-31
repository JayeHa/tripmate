"use client";

import { useState } from "react";

import { fareTotals, useTransportFares } from "@/entities/transport-fare";
import type { Trip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { dayCount } from "@/shared/lib/days";

import { homeApprox, startFareCurrency, totalsLabel, tripCurrencies } from "../lib/transport";
import type { FareTarget } from "./use-fare-form";

/**
 * 「교통」 탭 상태 — 교통비 줄 · 1인 합계(통화별 + 기준 통화 어림값 + 일행 수만큼) · 열린 편집 창.
 * 창은 한 번에 하나(교통비 줄 또는 교통카드 메모)
 */
export function useTransportTab(tripId: string, trip: Trip) {
  const fares = useTransportFares(tripId);
  const members = useTripMembers(tripId).data;
  const [editing, setEditing] = useState<FareTarget | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const totalDays = dayCount(trip.start_date, trip.end_date);
  const rows = fares.data ?? [];
  const totals = fareTotals(rows, totalDays);
  const people = members?.length ?? 1;
  const currencies = tripCurrencies(trip.home_currency, trip.exchange_rates);
  return {
    loading: fares.isPending,
    fares: rows,
    totalDays,
    total: totalsLabel(totals),
    approx: homeApprox(totals, trip.home_currency, trip.exchange_rates),
    group: people > 1 ? { people, total: totalsLabel(totals, people) } : null,
    currencies,
    startCurrency: startFareCurrency(currencies, rows),
    editing,
    setEditing,
    noteOpen,
    setNoteOpen,
  };
}
