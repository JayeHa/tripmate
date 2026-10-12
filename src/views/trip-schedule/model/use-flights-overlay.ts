"use client";

import { useState } from "react";

import { useFlights } from "@/entities/flight";

/** 항공편 창 — 화면(TripScheduleView)이 쥐고 그린다. 지금은 목록부터만 연다 */
export function useFlightsOverlay(tripId: string) {
  const [open, setOpen] = useState(false);
  const { data: flights } = useFlights(tripId);
  return {
    open,
    setOpen,
    /** 항공편 목록부터 연다(레일 · 여행 머리 칩) */
    openFlights: () => setOpen(true),
    /** 레일 · 여행 머리 버튼의 숫자. 아직 못 읽었으면 0 */
    count: flights?.length ?? 0,
  };
}
