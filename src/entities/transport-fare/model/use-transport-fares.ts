"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import {
  addExtraFare,
  clearDayFare,
  deleteFare,
  fetchTransportFares,
  saveDayFare,
  saveTransportNote,
  updateExtraFare,
} from "../api/transport-fares";
import { cleanDraft, isEmptyDraft } from "../lib/fares";
import type { FareDraft } from "./types";

/** 교통비의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const transportFaresQuery = (tripId: string) =>
  queryOptions({
    queryKey: queryKeys.transportFares(tripId),
    queryFn: () => fetchTransportFares(tripId),
  });

/** 여행의 1인 예상 교통비 */
export function useTransportFares(tripId: string) {
  return useQuery(transportFaresQuery(tripId));
}

/** 저장할 줄 — 날짜 줄은 그날, 날짜 밖 줄은 이름과 함께(id 가 있으면 고치기) */
export type FareSave =
  | { kind: "day"; dayIndex: number; draft: FareDraft }
  | { kind: "extra"; id: string | null; title: string; draft: FareDraft };

/** 한 줄을 서버에 — 날짜 줄은 금액 · 메모를 다 비우면 지운다 */
function saveFare(tripId: string, v: FareSave): Promise<void> {
  const draft = cleanDraft(v.draft);
  if (v.kind === "day") {
    return isEmptyDraft(draft)
      ? clearDayFare(tripId, v.dayIndex)
      : saveDayFare(tripId, v.dayIndex, draft);
  }
  return v.id ? updateExtraFare(v.id, v.title, draft) : addExtraFare(tripId, v.title, draft);
}

/** 교통비 한 줄 저장 — 창이 저장을 기다렸다 닫으므로 화면 먼저 바꾸지 않고, 끝나면 다시 읽는다 */
export function useSaveFare(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: FareSave) => saveFare(tripId, v),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.transportFares(tripId) }),
  });
}

/** 날짜 밖 줄 지우기 */
export function useDeleteFare(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFare,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.transportFares(tripId) }),
  });
}

/** 교통카드 · 패스 메모 저장 — 여행 하나만 다시 읽는다(그 아래 일정 · 비용 키는 상관없다) */
export function useSaveTransportNote(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => saveTransportNote(tripId, note.trim() || null),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId), exact: true }),
  });
}
