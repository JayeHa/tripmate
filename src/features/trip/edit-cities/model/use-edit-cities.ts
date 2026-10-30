"use client";

import { useState } from "react";

import { type City, useSetTripCities } from "@/entities/city";
import { countScheduleItemsByCity } from "@/entities/schedule-item";

import { type KeptItems, keptItems, removedCities, sameCities } from "../lib/removed";

/**
 * 여행 도시 추가 · 편집. 지금 도시를 고른 순서 그대로 골라 두고 시작한다(첫 도시가 여행 홈 위젯 · 지도의 기준).
 * 뺀 도시에 일정이 있으면 그대로 남는다고 확인받은 뒤 저장한다(set_trip_cities, 0065)
 */
export function useEditCities(tripId: string, current: City[], onDone: () => void) {
  const save = useSetTripCities(tripId);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(current);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [pendingKeep, setPendingKeep] = useState<KeptItems | null>(null);

  const unchanged = sameCities(current, picked);
  const commit = () => save.mutate(picked, { onSuccess: onDone });

  async function submit() {
    if (picked.length === 0 || unchanged || checking || save.isPending) return;
    const removed = removedCities(current, picked);
    if (removed.length === 0) return commit();

    setChecking(true);
    setCheckError(null);
    try {
      const kept = keptItems(
        removed,
        await countScheduleItemsByCity(
          tripId,
          removed.map((c) => c.id),
        ),
      );
      if (kept.length > 0) setPendingKeep(kept);
      else commit();
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : "남는 일정을 확인하지 못했어요");
    } finally {
      setChecking(false);
    }
  }

  return {
    query,
    setQuery,
    picked,
    toggle: (city: City) =>
      setPicked((prev) =>
        prev.some((c) => c.id === city.id) ? prev.filter((c) => c.id !== city.id) : [...prev, city],
      ),
    unchanged,
    submit: () => void submit(),
    pendingKeep,
    confirmKeep: () => {
      setPendingKeep(null);
      commit();
    },
    cancelKeep: () => setPendingKeep(null),
    busy: checking || save.isPending,
    error: checkError ?? save.error?.message ?? null,
    // 요청이 서버에 가 있는 동안은 닫지 못한다. 오프라인으로 멈춘 동안은 연다(#31)
    locked: checking || (save.isPending && !save.isPaused),
  };
}

export type EditCitiesState = ReturnType<typeof useEditCities>;
