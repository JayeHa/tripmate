"use client";

import { useMemo } from "react";

import {
  buildTimeline,
  type ScheduleItem,
  type TimelineRow,
  useAlternatives,
  useMemos,
  useMoves,
  useScheduleItems,
} from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { dayOfWeek } from "@/shared/lib/days";

/** 날짜 하나의 타임라인 줄 */
export type DaySectionData = { day: number; rows: TimelineRow[] };

/** 일정을 읽기 전의 빈 목록. 렌더마다 새 배열을 만들면 그걸 받는 memo 가 매번 다시 계산된다 */
const NO_ITEMS: ScheduleItem[] = [];

/**
 * 이어서 보기의 날짜별 줄 — 일정 · 이동 기록 · 대체 장소 · 메모를 읽어 날마다 타임라인 줄을 만든다.
 * 요일별 운영시간은 그날 요일 값을 고른다. 일정 · 이동 기록이 그대로면 같은 배열을 준다
 */
export function useScheduleSections(tripId: string, trip: Trip | undefined, totalDays: number) {
  const { data: items = NO_ITEMS, isPending, isSuccess: itemsReady } = useScheduleItems(tripId);
  // 이동 기록을 다 불러오기 전(또는 실패)에는 이동 방법 창을 열지 않는다. 빈 창에서 저장하면 기존 기록을 덮어쓴다
  const { data: moves, isSuccess: movesReady } = useMoves(tripId);
  const { data: alternatives } = useAlternatives(tripId);
  const { data: memos } = useMemos(tripId);
  const startDate = trip?.start_date;
  const sections = useMemo<DaySectionData[]>(
    () =>
      Array.from({ length: totalDays }, (_, day) => ({
        day,
        rows: buildTimeline(
          items.filter((it) => it.day_index === day),
          moves,
          startDate ? dayOfWeek(startDate, day) : null,
          alternatives,
          memos,
        ),
      })),
    [items, moves, alternatives, memos, startDate, totalDays],
  );
  return { items, isPending, itemsReady, movesReady, sections };
}
