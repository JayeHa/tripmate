"use client";

import { useState } from "react";

import { useFlights } from "@/entities/flight";

/** 항공편 창 — 화면(TripScheduleView)이 쥐고 그린다. 목록부터 열거나(레일 · 여행 머리 칩) 한 항공편의 상세부터 연다(일정 카드) */
export function useFlightsOverlay(tripId: string) {
  const [open, setOpen] = useState(false);
  // 처음 보일 항공편. null 이면 목록부터
  const [initialId, setInitialId] = useState<string | null>(null);
  const { data: flights } = useFlights(tripId);
  return {
    open,
    setOpen,
    initialId,
    /** 항공편 목록부터 연다(레일 · 여행 머리 칩) */
    openFlights: () => {
      setInitialId(null);
      setOpen(true);
    },
    /** 그 항공편의 상세부터 연다(일정의 항공편 카드) */
    openFlight: (id: string) => {
      setInitialId(id);
      setOpen(true);
    },
    /** 레일 · 여행 머리 버튼의 숫자. 아직 못 읽었으면 0 */
    count: flights?.length ?? 0,
  };
}
