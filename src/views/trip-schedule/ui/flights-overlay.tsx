"use client";

import type { Memo, ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { ExpenseDialog } from "@/features/expense/form";
import { FlightsDialog } from "@/features/flights";

import type { FlightsOverlayState } from "../model/use-flights-overlay";

type FlightsOverlayProps = {
  tripId: string;
  trip: Trip;
  items: readonly ScheduleItem[];
  flights: FlightsOverlayState;
  onToast: (text: string) => void;
  /** 항공편 상세의 메모 — 항공편 창을 닫고 메모 작성 창을 연다 */
  onMemo: (cardId: string, memo: Memo | null) => void;
};

/** 항공편 창과, 그 위에 겹쳐 여는 비용 입력 창(결제 칸 · 연결된 비용) */
export function FlightsOverlay({
  tripId,
  trip,
  items,
  flights,
  onToast,
  onMemo,
}: FlightsOverlayProps) {
  return (
    <>
      <FlightsDialog
        tripId={tripId}
        trip={trip}
        items={items}
        open={flights.open}
        onOpenChange={flights.setOpen}
        initialFlightId={flights.initialId}
        onToast={onToast}
        onMemo={onMemo}
        onExpense={flights.openExpense}
      />
      <ExpenseDialog
        tripId={tripId}
        target={flights.expense}
        onClose={flights.closeExpense}
        onToast={onToast}
      />
    </>
  );
}
