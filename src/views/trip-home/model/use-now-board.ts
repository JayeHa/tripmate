"use client";

import { format } from "date-fns";

import { peopleOf, type PersonRef, useExpenses, useTripGuests } from "@/entities/expense";
import { useFlights } from "@/entities/flight";
import { useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useStays } from "@/entities/stay";
import type { Trip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { useVouchers } from "@/entities/voucher";
import { dayIndexToDate, todayISO } from "@/shared/lib/days";

import { todaySpend, todayVouchers, tonightStay } from "../lib/now-board";
import { boardDayIndex, todayPlan } from "../lib/today-plan";
import { useVisited } from "./use-visited";

/** 지금 시각 「HH:mm」 */
function nowHHmm(): string {
  return format(new Date(), "HH:mm");
}

/**
 * 여행 중 상태판 — 오늘(여행 전 · 후에 미리 보면 첫날 · 마지막 날)의 다음 장소 · 들른 기록 · 바우처 · 지출 · 숙소.
 * 읽을 것이 하나라도 아직 오지 않았으면 null. 시각으로 지난 일정을 건너뛰는 건 그날이 정말 오늘일 때만
 */
export function useNowBoard(tripId: string, trip: Trip) {
  const today = todayISO();
  const dayIndex = boardDayIndex(trip.start_date, trip.end_date, today);
  const date = dayIndexToDate(trip.start_date, dayIndex);
  const [visited, setVisited] = useVisited(tripId, date);
  const items = useScheduleItems(tripId).data;
  const vouchers = useVouchers(tripId).data;
  const flights = useFlights(tripId).data;
  const stays = useStays(tripId).data;
  const expenses = useExpenses(tripId).data;
  const members = useTripMembers(tripId).data;
  const guests = useTripGuests(tripId).data;
  const userId = useUser().data?.id ?? null;
  if (!items || !vouchers || !flights || !stays || !expenses || !members || !guests) return null;
  const me: PersonRef | null = userId ? { kind: "member", id: userId } : null;
  return {
    dayIndex,
    date,
    visited,
    setVisited,
    plan: todayPlan(items, dayIndex, visited, date === today ? nowHHmm() : null),
    vouchers: todayVouchers(vouchers, { items, flights, stays, dayIndex, date }, userId),
    spend: todaySpend(expenses, date, {
      home: trip.home_currency,
      rates: trip.exchange_rates,
      people: peopleOf(
        members.map((m) => m.user_id),
        guests,
      ),
      me,
    }),
    stay: tonightStay(stays, date),
  };
}

/** 여행 중 상태판에 그릴 것 */
export type NowBoard = NonNullable<ReturnType<typeof useNowBoard>>;
