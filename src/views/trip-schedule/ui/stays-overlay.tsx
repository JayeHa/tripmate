"use client";

import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { ExpenseDialog } from "@/features/expense/form";
import { PlaceFormDialog } from "@/features/schedule/place-form";
import { StaysDialog } from "@/features/stays";

import type { StaysOverlayState } from "../model/use-stays-overlay";

type StaysOverlayProps = {
  tripId: string;
  trip: Trip;
  items: readonly ScheduleItem[];
  stays: StaysOverlayState;
  onToast: (text: string) => void;
};

/** 숙소 창과, 그 위에 겹쳐 여는 주소 칸의 「위치만 고르기」(장소 입력 폼의 ① 만) · 결제 칸의 비용 입력 창 */
export function StaysOverlay({ tripId, trip, items, stays, onToast }: StaysOverlayProps) {
  return (
    <>
      <StaysDialog
        tripId={tripId}
        trip={trip}
        items={items}
        open={stays.open}
        onOpenChange={stays.setOpen}
        initialStayId={stays.initialId}
        registration={stays.registration}
        onPickLocation={stays.requestPick}
        onPayment={stays.openPayment}
        onToast={onToast}
      />
      <ExpenseDialog
        tripId={tripId}
        target={stays.payment}
        onClose={stays.closePayment}
        onToast={onToast}
      />
      {stays.pick && (
        <PlaceFormDialog
          tripId={tripId}
          city={stays.city}
          mode={{
            kind: "location",
            initial: stays.pick.initial,
            title: "숙소 주소",
            onPicked: (location) => {
              stays.pick?.onPicked(location);
              stays.closePick();
            },
          }}
          open
          onOpenChange={(open) => !open && stays.closePick()}
        />
      )}
    </>
  );
}
