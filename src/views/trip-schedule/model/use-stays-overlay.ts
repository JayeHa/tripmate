"use client";

import { useState } from "react";

import { useTripCities } from "@/entities/city";
import { useStays } from "@/entities/stay";
import type { LocationPickRequest } from "@/features/stays";

/**
 * 숙소 창(목록 · 상세 · 입력)과, 그 위에 여는 장소 입력 폼의 「위치만 고르기」. 화면(TripScheduleView)이 쥐고 StaysOverlay 가 그린다.
 * 위치 고르기의 도시(검색 범위 · 지도 중심)는 여행의 첫 도시
 */
export function useStaysOverlay(tripId: string) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<LocationPickRequest | null>(null);
  const { data: stays } = useStays(tripId);
  const { data: cities = [] } = useTripCities(tripId);
  return {
    open,
    openStays: () => setOpen(true),
    setOpen,
    /** 레일 · 상단바 버튼의 숫자. 아직 못 읽었으면 0 */
    count: stays?.length ?? 0,
    pick,
    requestPick: setPick,
    closePick: () => setPick(null),
    city: cities[0] ?? null,
  };
}

export type StaysOverlayState = ReturnType<typeof useStaysOverlay>;
