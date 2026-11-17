"use client";

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useMemo } from "react";

import { useTripHolidays } from "@/entities/city";
import {
  buildRouteDay,
  buildTimeline,
  type CrewMember,
  ratingsByItem,
  ratingsQuery,
  type ScheduleItem,
  useMoves,
  useScheduleItems,
  useVisitMarks,
  useVisitNotes,
  useVisitPhotos,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { type Trip, useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { holidayName } from "@/shared/lib/country-holidays";
import { dayCount, dayIndexToDate, dayOfWeek, todayISO } from "@/shared/lib/days";

import { type DayInput, travelogueDays, travelogueTotals } from "../lib/travelogue";

const NO_ITEMS: ScheduleItem[] = [];

/** 여행 중 오늘(0부터) — 여행 전 · 끝난 뒤면 null. 끝났는지도 */
function todayOf(trip: Trip | undefined) {
  if (!trip) return { today: null, ended: false };
  const index = differenceInCalendarDays(parseISO(todayISO()), parseISO(trip.start_date));
  const days = dayCount(trip.start_date, trip.end_date);
  return { today: index >= 0 && index < days ? index : null, ended: index >= days };
}

/**
 * 여행기 — 일정 · 이동 · 다녀감 · 기록 글 · 사진 · 별점 · 멤버를 읽어 하루씩 엮는다. 새로 입력받는 것은 없다.
 * 오늘까지의 날(끝난 여행은 모든 날)만 열린다 — 다녀감을 고칠 수 있는 날과 같다.
 * 다녀감은 일정 화면과 같은 기기 저장을 쓴다(오프라인에서도 본 것은 보인다)
 */
export function useTravelogue(tripId: string) {
  const { data: trip } = useTrip(tripId);
  const { data: items = NO_ITEMS, isSuccess: itemsReady } = useScheduleItems(tripId);
  const { data: moves } = useMoves(tripId);
  const [marks] = useVisitMarks(tripId);
  const userId = useUser().data?.id ?? null;
  const [notes] = useVisitNotes(tripId, userId);
  const photos = useVisitPhotos(tripId);
  const { data: ratings } = useQuery(ratingsQuery(tripId));
  const { data: members } = useTripMembers(tripId);
  const holidays = useTripHolidays(tripId, trip);
  const crew = useMemo(
    () =>
      (members ?? []).map((m): CrewMember => ({
        id: m.user_id,
        name: m.profile.display_name ?? "이름 없음",
        avatarUrl: m.profile.avatar_url,
      })),
    [members],
  );
  const { today, ended } = todayOf(trip);
  const days = useMemo(() => {
    if (!trip) return [];
    const inputs = Array.from(
      { length: dayCount(trip.start_date, trip.end_date) },
      (_, day): DayInput => {
        const rows = buildTimeline(
          items.filter((it) => it.day_index === day),
          moves,
          dayOfWeek(trip.start_date, day),
        );
        return {
          day,
          stops: buildRouteDay(rows).stops,
          summary: trip.day_summaries[day] ?? null,
          open: ended || (today !== null && day <= today),
          today: day === today,
        };
      },
    );
    const byItem = ratingsByItem(ratings ?? [], items);
    return travelogueDays(inputs, {
      marks,
      notes,
      photos,
      ratings: byItem,
      members: crew,
      me: userId,
    });
  }, [trip, items, moves, marks, notes, photos, ratings, crew, userId, today, ended]);
  return {
    trip,
    ready: trip !== undefined && itemsReady,
    days,
    totals: useMemo(() => travelogueTotals(days), [days]),
    members: crew,
    /** 여행 중(오늘이 여행 안) — 커버에 「여행 중」 */
    traveling: today !== null,
    /** 그 날(0부터)의 여행지 공휴일 이름. 아니거나 아직 모르면 null */
    holidayOf: (day: number) =>
      trip && holidays ? holidayName(holidays, dayIndexToDate(trip.start_date, day)) : null,
    /** 올린 사람 — 혼자 여행이거나 나간 사람이면 null(그리지 않는다) */
    uploader: (id: string | null) =>
      crew.length > 1 ? (crew.find((m) => m.id === (id ?? userId)) ?? null) : null,
  };
}

export type Travelogue = ReturnType<typeof useTravelogue>;
