"use client";

import { useMemos, useScheduleItems } from "@/entities/schedule-item";
import { todayISO } from "@/shared/lib/days";

import { type PinnedMemo, pinnedMemos } from "../lib/pinned-memos";

/** 「홈에 고정」 한 메모 — 여행 전 · 중 · 후 상태판 모두의 맨 아래 카드. 일정 · 메모를 아직 읽지 않았으면 null */
export function usePinnedMemos(tripId: string, startDate: string): PinnedMemo[] | null {
  const items = useScheduleItems(tripId).data;
  const memos = useMemos(tripId).data;
  if (!items || !memos) return null;
  return pinnedMemos(memos, items, { tripId, startDate, today: todayISO() });
}
