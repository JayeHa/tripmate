"use client";

import { useFlights } from "@/entities/flight";
import { useAlternatives, useScheduleItems } from "@/entities/schedule-item";
import { useStays } from "@/entities/stay";
import { useTrip } from "@/entities/trip";

import type { TargetSources } from "../lib/target-options";

/** 연결 고르기 · 이름에 쓰는 여행의 일정(대체 장소 포함) · 항공편 · 숙소. 다 읽기 전에는 null */
export function useTargetSources(tripId: string): TargetSources | null {
  const { data: trip } = useTrip(tripId);
  const { data: items } = useScheduleItems(tripId);
  const { data: flights } = useFlights(tripId);
  const { data: stays } = useStays(tripId);
  const { data: alternatives } = useAlternatives(tripId);
  if (!trip || !items || !flights || !stays || !alternatives) return null;
  return { startDate: trip.start_date, items, alternatives, flights, stays };
}
