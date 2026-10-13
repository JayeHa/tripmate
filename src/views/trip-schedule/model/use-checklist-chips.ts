"use client";

import { useCallback } from "react";

import { cardTargets, openChecklistFor, useChecklistIndex } from "@/entities/checklist";
import type { TimelineRow } from "@/entities/schedule-item";

/**
 * 카드의 「체크리스트 N」 칩 — 그 카드(항공편 · 숙소 카드면 그 항공편 · 숙소 포함)에 연결된 끝나지 않은 항목 수와
 * 노트 체크리스트 주소. 대체 장소로 바뀐 일정에 연결된 항목은 장소를 따라가서(2026-10-13 사용자 결정) 타임라인 칩에 세지 않는다
 */
export function useChecklistChips(tripId: string) {
  const index = useChecklistIndex(tripId);
  return useCallback(
    (row: TimelineRow) => ({
      count: openChecklistFor(index, cardTargets(row.item)).length,
      href: `/trips/${tripId}/notes?tab=checklist`,
    }),
    [index, tripId],
  );
}
