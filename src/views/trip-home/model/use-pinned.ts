"use client";

import { useChecklist } from "@/entities/checklist";
import { useMemos, useScheduleItems } from "@/entities/schedule-item";
import { useVouchers } from "@/entities/voucher";
import { todayISO } from "@/shared/lib/days";

import {
  type PinnedTodo,
  pinnedTodos,
  type PinnedVoucher,
  pinnedVouchers,
} from "../lib/pinned-items";
import { type PinnedMemo, pinnedMemos } from "../lib/pinned-memos";

/** 홈 「고정한 항목」 카드에 그릴 것 — 할 일 · 바우처 · 메모 순 */
export type PinnedBoard = { todos: PinnedTodo[]; vouchers: PinnedVoucher[]; memos: PinnedMemo[] };

/**
 * 「홈에 고정」 한 것 — 체크리스트 할 일 · 바우처 · 메모(장소 · 날짜). 여행 전 · 중 · 후 상태판 모두의 맨 아래 카드.
 * 하나라도 아직 읽지 않았으면 null(반쯤 채운 카드가 보였다가 바뀌지 않게)
 */
export function usePinned(tripId: string, startDate: string): PinnedBoard | null {
  const checklist = useChecklist(tripId).data;
  const vouchers = useVouchers(tripId).data;
  const items = useScheduleItems(tripId).data;
  const memos = useMemos(tripId).data;
  if (!checklist || !vouchers || !items || !memos) return null;
  const ctx = { tripId, startDate, today: todayISO() };
  return {
    todos: pinnedTodos(checklist, ctx),
    vouchers: pinnedVouchers(vouchers, ctx),
    memos: pinnedMemos(memos, items, ctx),
  };
}
