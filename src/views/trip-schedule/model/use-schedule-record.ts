"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  type DayMode,
  type ScheduleItem,
  useVisitMarks,
  type VisitMarks,
  visitsQuery,
} from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import { type RecordDay, recordDay } from "../lib/record";
import { useScheduleEntry } from "./use-schedule-progress";

/** 기록 모드가 읽고 바꾸는 다녀감(일행 공유 표시) */
export type ScheduleRecord = {
  marks: VisitMarks;
  /** 표시를 남긴 시각(ISO) — 「10:52 도착」. 없으면 null */
  markedAt: (id: string) => string | null;
  /**
   * 그 날이 여행 중 오늘 · 오늘 앞 · 그 밖인지. 「✓ 다녀왔어요」 는 오늘까지(상세 「방문」 과 같은 규칙),
   * 「지금 여기」 는 오늘만
   */
  dayOf: (day: number) => RecordDay;
  /** 「✓ 다녀왔어요」 — 오프라인 대기열로 올라가고 화면은 먼저 바뀐다 */
  markVisited: (id: string) => void;
};

/**
 * 일정 화면의 「계획 | 기록」 과 다녀감. 들어갈 곳 · 회색(useScheduleEntry)을 함께 돌려준다.
 * 보기는 화면 전체에 하나이고 날짜를 바꿔도 그대로다. 고르기 전에는 여행 중이면 기록, 아니면 계획
 */
export function useScheduleRecord(
  tripId: string,
  trip: Trip | undefined,
  items: readonly ScheduleItem[],
  ready: { items: boolean; settled: boolean },
) {
  const entry = useScheduleEntry(tripId, trip, items, ready);
  const { todayIndex } = entry;
  const [picked, setPicked] = useState<DayMode | null>(null);
  const [marks, setMark] = useVisitMarks(tripId);
  const { data } = useQuery(visitsQuery(tripId));
  const at = useMemo(() => new Map(data?.map((v) => [v.item_id, v.marked_at])), [data]);
  const record: ScheduleRecord = {
    marks,
    markedAt: (id) => at.get(id) ?? null,
    dayOf: (day) => recordDay(day, todayIndex),
    markVisited: (id) => setMark(id, "visited"),
  };
  return {
    ...entry,
    mode: picked ?? (todayIndex !== null ? "record" : "plan"),
    onModeChange: setPicked,
    record,
  };
}
