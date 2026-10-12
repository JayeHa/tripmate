"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useFlights } from "@/entities/flight";
import { queryKeys } from "@/shared/api/query-keys";

/** 항공편 창 — 화면(TripScheduleView)이 쥐고 그린다. 목록부터 열거나(레일 · 여행 머리 칩) 한 항공편의 상세부터 연다(일정 카드) */
export function useFlightsOverlay(tripId: string) {
  const [open, setOpen] = useState(false);
  // 처음 보일 항공편. null 이면 목록부터
  const [initialId, setInitialId] = useState<string | null>(null);
  const { data: flights } = useFlights(tripId);
  const qc = useQueryClient();
  return {
    open,
    setOpen,
    initialId,
    /** 항공편 목록부터 연다(레일 · 여행 머리 칩) */
    openFlights: () => {
      setInitialId(null);
      setOpen(true);
    },
    /**
     * 그 항공편의 상세부터 연다(일정의 항공편 카드). 목록에 아직 없으면(일행이 막 넣어 카드가 먼저 왔다) 목록을 다시 읽는다 —
     * 상세는 다시 읽는 동안 기다린다(useCurrentFlight)
     */
    openFlight: (id: string) => {
      if (!flights?.some((f) => f.id === id)) {
        void qc.invalidateQueries({ queryKey: queryKeys.flights(tripId) });
      }
      setInitialId(id);
      setOpen(true);
    },
    /** 레일 · 여행 머리 버튼의 숫자. 아직 못 읽었으면 0 */
    count: flights?.length ?? 0,
  };
}
