"use client";

import { useMemo } from "react";

import { useTripCities } from "@/entities/city";
import { type ScheduleItem, useSavedPlaces } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";

import { alternativeChoices } from "../lib/alternatives";

/**
 * 「저장한 장소에서 고르기」 의 목록 — 이 여행 도시의 내 장소에서 이 일정 · 이미 붙은 대체 장소의 장소를 빼고 이름으로 거른다.
 * 홈 가이드(#17)가 생기면 가이드 장소로 바꾼다. 고르기를 열었을 때만 마운트돼 그때 읽는다
 */
export function useAlternativeChoices(
  tripId: string,
  main: ScheduleItem,
  alternatives: ScheduleItem[],
  query: string,
) {
  const { data: user } = useUser();
  const { data: cities = [] } = useTripCities(tripId);
  const cityIds = useMemo(() => cities.map((c) => c.id), [cities]);
  const saved = useSavedPlaces(tripId, user?.id, cityIds);
  return {
    choices: alternativeChoices(saved.data ?? [], main, alternatives, query),
    loading: saved.isPending,
  };
}
