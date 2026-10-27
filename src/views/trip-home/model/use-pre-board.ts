"use client";

import { useChecklist } from "@/entities/checklist";
import { useExpenses } from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { todayISO } from "@/shared/lib/days";

import {
  type DeadlineRow,
  deadlineRows,
  type PrepStats,
  prepStats,
  type ReserveRow,
  reserveRows,
} from "../lib/pre-board";

/** 여행 전 상태판에 그릴 것 */
export type PreBoard = {
  prep: PrepStats;
  deadlines: DeadlineRow[];
  reserves: ReserveRow[];
};

/**
 * 여행 전 상태판 — 체크리스트 · 일정 · 비용을 읽어 카드 셋의 내용으로. 하나라도 아직 오지 않았으면 null
 * (반쯤 채운 카드가 보였다가 바뀌지 않게)
 */
export function usePreBoard(tripId: string, startDate: string): PreBoard | null {
  const checklist = useChecklist(tripId).data;
  const items = useScheduleItems(tripId).data;
  const expenses = useExpenses(tripId).data;
  if (!checklist || !items || !expenses) return null;
  const ctx = { tripId, startDate, today: todayISO() };
  return {
    prep: prepStats(checklist, items, expenses),
    deadlines: deadlineRows(checklist, expenses, ctx),
    reserves: reserveRows(items, ctx),
  };
}
