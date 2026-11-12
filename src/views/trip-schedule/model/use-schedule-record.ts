"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import {
  type DayMode,
  ratingsByItem,
  ratingsQuery,
  type RatingStars,
  type ScheduleItem,
  useMyRatings,
  useMyVisitNotes,
  useMyVisitPhotos,
  useVisitMarks,
  useVisitPhotoUrls,
  visitCountsOf,
  type VisitMark,
  type VisitMarks,
  type VisitNoteBodies,
  type VisitPhotosByItem,
  visitsQuery,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import type { Trip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";

import { type CrewMember, type CrewRating, crewRating } from "../lib/crew";
import { type RecordDay, recordDay } from "../lib/record";
import { useScheduleEntry } from "./use-schedule-progress";

const NO_URLS: Readonly<Record<string, string>> = {};

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
  /** 방문 토글 — 다녀왔어요 · 패스 · 지우기(null). 오프라인 대기열로 올라가고 화면은 먼저 바뀐다 */
  setMark: (id: string, mark: VisitMark | null) => void;
  /** 내 별점 — 일정 id → 1~5. 별점은 여행의 장소마다 하나라 같은 장소의 일정은 같은 값, 안 매긴 일정은 없다 */
  stars: RatingStars;
  /** 일정 id → 그 장소를 이 여행에서 들르는 횟수(장소 일정만) — 2 이상이면 별점 줄 아래 반복 안내 */
  visits: Readonly<Record<string, number>>;
  /** 그 일정 장소의 「일행」 줄 — 나를 뺀 멤버의 별점 · 평균. 혼자 여행이면 null */
  crew: (id: string) => CrewRating | null;
  /** 내 별점을 바꾼다(0 이면 지운다) — 오프라인 대기열로 올라가고 화면은 먼저 바뀐다 */
  rate: (id: string, stars: number) => void;
  /** 내 기록 글 — 일정 id → 글. 안 남긴 일정은 없다 */
  notes: VisitNoteBodies;
  /** 내 기록 글을 바꾼다(비우면 지운다) — 오프라인 대기열로 올라가고 화면은 먼저 바뀐다 */
  saveNote: (id: string, body: string) => void;
  /** 내 기록 사진 — 일정 id → 순서대로. 붙이지 않은 일정은 없다(바꾸기는 기록 창이 한다) */
  photos: VisitPhotosByItem;
  /** 내 기록 사진 썸네일의 키 → 읽기 주소(카드 사진 줄) */
  thumbUrls: Readonly<Record<string, string>>;
  /** 기록 창을 연 일정. 닫혀 있으면 null */
  writing: string | null;
  openWrite: (id: string) => void;
  closeWrite: () => void;
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
  const userId = useUser().data?.id ?? null;
  const [stars, setStars] = useMyRatings(tripId, userId, items);
  const visits = useMemo(() => visitCountsOf(items), [items]);
  const crew = useCrew(tripId, userId, items);
  const [notes, setNote] = useMyVisitNotes(tripId, userId);
  const photos = useMyVisitPhotos(tripId, userId);
  const thumbKeys = useMemo(
    () => Object.values(photos).flatMap((ps) => ps.map((p) => p.thumb_key)),
    [photos],
  );
  const { data: thumbUrls = NO_URLS } = useVisitPhotoUrls(tripId, thumbKeys);
  const [writing, setWriting] = useState<string | null>(null);
  const at = useMemo(() => new Map(data?.map((v) => [v.item_id, v.marked_at])), [data]);
  const record: ScheduleRecord = {
    marks,
    markedAt: (id) => at.get(id) ?? null,
    dayOf: (day) => recordDay(day, todayIndex),
    setMark,
    stars,
    visits,
    crew,
    rate: setStars,
    notes,
    saveNote: setNote,
    photos,
    thumbUrls,
    writing,
    openWrite: setWriting,
    closeWrite: () => setWriting(null),
  };
  return {
    ...entry,
    mode: picked ?? (todayIndex !== null ? "record" : "plan"),
    onModeChange: setPicked,
    record,
  };
}

const NO_STARS = {};

/** 일정 id → 「일행」 줄. 멤버 · 별점이 바뀔 때만 새로 만든다 */
function useCrew(tripId: string, userId: string | null, items: readonly ScheduleItem[]) {
  const { data: ratings } = useQuery(ratingsQuery(tripId));
  const { data: members } = useTripMembers(tripId);
  const byItem = useMemo(() => ratingsByItem(ratings ?? [], items), [ratings, items]);
  const crewMembers = useMemo(
    () =>
      (members ?? []).map((m): CrewMember => ({
        id: m.user_id,
        name: m.profile.display_name ?? "이름 없음",
        avatarUrl: m.profile.avatar_url,
      })),
    [members],
  );
  return (id: string) => crewRating(crewMembers, userId, byItem[id] ?? NO_STARS);
}
