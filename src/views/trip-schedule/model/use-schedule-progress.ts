"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  dayProgress,
  type PastKind,
  type ScheduleItem,
  useVisitMarks,
} from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { dayCount, nowHHmm, todayISO } from "@/shared/lib/days";

import type { ScheduleEntry } from "./use-entry-scroll";

/** 여행 중 오늘의 진행 — 다녀온 줄(회색) · 오늘 날짜 · 다음 장소 */
export type ScheduleProgress = {
  past: ReadonlyMap<string, PastKind>;
  todayIndex: number;
  /** 오늘의 다음 장소. 다 마쳤으면 null */
  nextId: string | null;
};

/**
 * 일정 화면의 「다녀온 일정」 — 홈 「오늘」 카드와 같은 기준(dayProgress · 기기별 다녀감 표시 · 지금 시각).
 * 여행 중일 때만 — 여행 전 · 후, 여행 · 일정을 읽기 전에는 null(아무것도 흐리게 하지 않는다).
 * 시각은 그릴 때마다 다시 본다(화면을 띄워 둔 채로 시간이 지나도 다시 그려질 때 따라간다)
 */
export function useScheduleProgress(
  tripId: string,
  trip: Trip | undefined,
  items: readonly ScheduleItem[] | null,
): ScheduleProgress | null {
  const today = todayISO();
  const [marks] = useVisitMarks(tripId);
  if (!trip || !items) return null;
  const todayIndex = differenceInCalendarDays(parseISO(today), parseISO(trip.start_date));
  if (todayIndex < 0 || todayIndex >= dayCount(trip.start_date, trip.end_date)) return null;
  return { ...dayProgress(items, todayIndex, marks, nowHHmm()), todayIndex };
}

/** 여행 중이 아닐 때의 다녀온 줄 — 렌더마다 새 Set 을 만들지 않게 */
const NO_PAST: ReadonlyMap<string, PastKind> = new Map();

/**
 * 일정 화면이 레이아웃에 내리는 「다녀온 일정」 과 「들어갈 때 보여 줄 곳」.
 * 들어갈 곳은 주소에 `?day` 가 없이 들어왔을 때만(홈 「일정 ›」 · 하단 탭) — 날짜를 골라 들어왔으면(`?day` · `?open`) 그 날짜가 먼저다.
 * 레이아웃이 한 번 처리하면 onEntryDone 으로 비운다. 일정을 다 읽기 전(itemsReady)에는 둘 다 없고,
 * 들어갈 곳은 줄 높이를 바꾸는 데이터까지 다 읽은 뒤(settled)에 준다 — 먼저 옮기면 늦게 온 이동 · 메모에 줄이 밀린다
 */
export function useScheduleEntry(
  tripId: string,
  trip: Trip | undefined,
  items: readonly ScheduleItem[],
  ready: { items: boolean; settled: boolean },
) {
  const progress = useScheduleProgress(tripId, trip, ready.items ? items : null);
  const searchParams = useSearchParams();
  const [fromTop] = useState(() => !searchParams.has("day"));
  const [done, setDone] = useState(false);
  const day = progress?.todayIndex ?? null;
  const settled = ready.settled;
  const id = progress?.nextId ?? null;
  const entry = useMemo<ScheduleEntry | null>(
    () => (fromTop && !done && settled && day !== null ? { day, id } : null),
    [fromTop, done, settled, day, id],
  );
  const onEntryDone = useCallback(() => setDone(true), []);
  return { past: progress?.past ?? NO_PAST, entry, onEntryDone };
}
