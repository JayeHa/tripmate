"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { deleteStay, fetchStays, saveStay, updateStayStatus } from "../api/stays";
import type { StayFieldsInput, StayPlaceInput } from "./types";

/** 여행의 숙소 목록 */
export function useStays(tripId: string) {
  return useQuery({ queryKey: queryKeys.stays(tripId), queryFn: () => fetchStays(tripId) });
}

/** 숙소가 바뀌면 다시 읽을 것 — 숙소 · 연결 카드(일정 · 경로) · 저장한 장소(새 장소가 생길 수 있다) */
function useInvalidateStays(tripId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.stays(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.savedPlaces(tripId) });
  };
}

/** 숙소 저장(새로 · 고치기). 성공하면 숙소 · 일정 · 경로 · 저장한 장소를 다시 읽는다 */
export function useSaveStay(tripId: string) {
  const invalidate = useInvalidateStays(tripId);
  return useMutation({
    mutationFn: (v: {
      stayId: string | null;
      place: StayPlaceInput;
      fields: StayFieldsInput;
      prune: boolean;
      /** 「숙소로 등록」 한 일정 카드 */
      linkItemId?: string | null;
    }) => saveStay(tripId, v.stayId, v.place, v.fields, v.prune, v.linkItemId ?? null),
    onSuccess: invalidate,
  });
}

/** 숙소 지우기 — 연결 카드를 남기거나 함께 지운다 */
export function useDeleteStay(tripId: string) {
  const invalidate = useInvalidateStays(tripId);
  return useMutation({
    mutationFn: (v: { stayId: string; deleteCards: boolean }) =>
      deleteStay(v.stayId, v.deleteCards),
    onSuccess: invalidate,
  });
}

/** 상세 화면의 예약 상태 바로 바꾸기 */
export function useUpdateStayStatus(tripId: string) {
  const invalidate = useInvalidateStays(tripId);
  return useMutation({
    mutationFn: (v: { stayId: string; status: string | null }) =>
      updateStayStatus(v.stayId, v.status),
    onSuccess: invalidate,
  });
}
