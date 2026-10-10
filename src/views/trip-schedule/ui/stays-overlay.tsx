"use client";

import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
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

/** 숙소 창과, 주소 칸이 요청한 「위치만 고르기」(장소 입력 폼의 ① 만) — 숙소 창 위에 겹쳐 연다 */
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
