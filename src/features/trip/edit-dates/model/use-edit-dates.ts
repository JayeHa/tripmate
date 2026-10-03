"use client";

import { useState } from "react";

import { countExpensesFrom } from "@/entities/expense";
import { countScheduleItemsFrom } from "@/entities/schedule-item";
import { type Trip, useUpdateTripDates } from "@/entities/trip";
import { type DateSelection, pickDate } from "@/shared/lib/calendar";

import { type Shrink, shrinkOf } from "../lib/shrink";

/** 마지막 날로 옮겨질 일정·지출이 있어 확인을 기다리는 중 */
export type PendingMove = Shrink & { items: number; expenses: number };

/**
 * 여행 기간 수정 (시안 5c 수정 모드). 기존 기간을 미리 골라 두고, 줄여서 사라지는 날에
 * 일정·지출이 있으면 마지막 날로 옮긴다고 확인받은 뒤 저장한다(update_trip_dates, 0009).
 */
export function useEditDates(trip: Trip, onDone: () => void) {
  const update = useUpdateTripDates();
  const [selection, setSelection] = useState<DateSelection>({
    start: trip.start_date,
    end: trip.end_date,
  });
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const unchanged = selection?.start === trip.start_date && selection.end === trip.end_date;

  const save = (range: { start: string; end: string }) =>
    update.mutate(
      { tripId: trip.id, startDate: range.start, endDate: range.end },
      { onSuccess: onDone },
    );

  async function submit() {
    if (!selection?.end || unchanged || checking || update.isPending) return;
    const range = { start: selection.start, end: selection.end };
    const shrink = shrinkOf({ start: trip.start_date, end: trip.end_date }, range);
    if (!shrink) return save(range);

    setChecking(true);
    setCheckError(null);
    try {
      const [items, expenses] = await Promise.all([
        countScheduleItemsFrom(trip.id, shrink.lastDay),
        countExpensesFrom(trip.id, shrink.fromDate),
      ]);
      if (items + expenses > 0) setPendingMove({ ...shrink, items, expenses });
      else save(range);
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : "옮길 일정을 확인하지 못했어요");
    } finally {
      setChecking(false);
    }
  }

  return {
    trip,
    selection,
    pick: (date: string) => setSelection((prev) => pickDate(prev, date)),
    unchanged,
    submit: () => void submit(),
    pendingMove,
    confirmMove: () => {
      setPendingMove(null);
      if (selection?.end) save({ start: selection.start, end: selection.end });
    },
    cancelMove: () => setPendingMove(null),
    busy: checking || update.isPending,
    error: checkError ?? update.error?.message ?? null,
    // 요청이 서버에 가 있는 동안은 닫지 못한다. 오프라인으로 멈춘 동안은 연다(#31)
    locked: checking || (update.isPending && !update.isPaused),
  };
}

export type EditDatesState = ReturnType<typeof useEditDates>;
