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
import { useStays } from "@/entities/stay";
import type { Trip } from "@/entities/trip";
import { dayOfWeek } from "@/shared/lib/days";

import { withStayCards } from "../lib/stay-cards";

/** 날짜 하나의 타임라인 줄 */
export type DaySectionData = { day: number; rows: TimelineRow[] };

/** 일정을 읽기 전의 빈 목록. 렌더마다 새 배열을 만들면 그걸 받는 memo 가 매번 다시 계산된다 */
const NO_ITEMS: ScheduleItem[] = [];

/**
 * 이어서 보기의 날짜별 줄 — 일정 · 이동 기록 · 대체 장소 · 메모를 읽어 날마다 타임라인 줄을 만든다.
 * 요일별 운영시간은 그날 요일 값을 고른다. 숙소에 연결된 카드는 숙소 모양(26b)을 붙인다. 일정 · 이동 기록이 그대로면 같은 배열을 준다
 */
export function useScheduleSections(tripId: string, trip: Trip | undefined, totalDays: number) {
  const { data: items = NO_ITEMS, isPending, isSuccess: itemsReady } = useScheduleItems(tripId);
  // 이동 기록을 다 불러오기 전(또는 실패)에는 이동 방법 창을 열지 않는다. 빈 창에서 저장하면 기존 기록을 덮어쓴다
  const { data: moves, isSuccess: movesReady } = useMoves(tripId);
  const { data: alternatives, isSuccess: altsReady } = useAlternatives(tripId);
  const { data: memos, isSuccess: memosReady } = useMemos(tripId);
  const { data: stays, isSuccess: staysReady } = useStays(tripId);
  const startDate = trip?.start_date;
  const sections = useMemo<DaySectionData[]>(
    () =>
      Array.from({ length: totalDays }, (_, day) => {
        const rows = buildTimeline(
          items.filter((it) => it.day_index === day),
          moves,
          startDate ? dayOfWeek(startDate, day) : null,
          alternatives,
          memos,
        );
        return { day, rows: startDate ? withStayCards(rows, stays ?? [], startDate, day) : rows };
      }),
    [items, moves, alternatives, memos, stays, startDate, totalDays],
  );
  // 여행 · 일정을 다 읽었다 — 여행을 읽기 전에는 날짜 수를 몰라 첫날 줄만 있다
  const sectionsReady = itemsReady && startDate !== undefined;
  // 줄 높이를 바꾸는 것(이동 · 대체 장소 · 메모 · 숙소 모양)까지 다 읽었다 — 들어갈 때 줄로 옮기는 스크롤이 기다린다(늦게 오면 줄이 밀린다)
  const settled = sectionsReady && movesReady && altsReady && memosReady && staysReady;
  return { items, isPending, itemsReady, movesReady, sections, sectionsReady, settled };
}
