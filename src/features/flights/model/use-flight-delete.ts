"use client";

import { useState } from "react";

import { useDeleteFlight } from "@/entities/flight";

type FlightDeleteOptions = {
  tripId: string;
  flightId: string;
  /** 지웠다 — 폼은 부른 쪽이 닫는다 */
  onDeleted: () => void;
};

/** 「항공편 삭제」 — 확인창을 거쳐 지운다. 일정 카드와 그 메모도 함께 지워진다(cascade) */
export function useFlightDelete({ tripId, flightId, onDeleted }: FlightDeleteOptions) {
  const [open, setOpen] = useState(false);
  const remove = useDeleteFlight(tripId);
  return {
    open,
    request: () => setOpen(true),
    cancel: () => setOpen(false),
    confirm: () => {
      setOpen(false);
      remove.mutate(flightId, { onSuccess: onDeleted });
    },
    deleting: remove.isPending,
    error: remove.error?.message ?? null,
  };
}

export type FlightDeleteState = ReturnType<typeof useFlightDelete>;
