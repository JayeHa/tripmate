"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import type { TablesUpdate } from "@/shared/api/supabase/database.types";

import { applyScheduleEdit } from "../api/schedule-edit";
import {
  addDayMemo,
  addPlacesToSchedule,
  createPlaceSchedule,
  deleteScheduleItem,
  fetchSavedPlaces,
  fetchScheduleItems,
  moveScheduleItemToDay,
  type NewPlaceFields,
  type ScheduleEntry,
  swapScheduleItems,
  updatePlace,
  updateScheduleItem,
} from "../api/schedule-items";
import type { ScheduleItem } from "./types";

export function useScheduleItems(tripId: string) {
  return useQuery({
    queryKey: queryKeys.scheduleItems(tripId),
    queryFn: () => fetchScheduleItems(tripId),
  });
}

function useInvalidateItems(tripId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
    void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
  };
}

/**
 * 고른 곳들을 그날 끝에 담는다(장소 + 일정). 새 장소가 생길 수 있어 저장한 장소 목록도 다시 읽는다.
 * 실패 문구는 addPlaceErrorMessage 로 바꿔 보인다.
 */
export function useAddPlacesToSchedule(tripId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ dayIndex, entries }: { dayIndex: number; entries: ScheduleEntry[] }) =>
      addPlacesToSchedule(tripId, dayIndex, entries),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: queryKeys.savedPlaces(tripId) });
    },
  });
}

/** 장소를 직접 입력해 그날 끝에(또는 일정의 대체 장소로) 담는다(새 장소 + 일정). 저장한 장소 목록도 다시 읽는다 */
export function useCreatePlaceSchedule(tripId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: (v: {
      dayIndex: number;
      place: NewPlaceFields;
      emoji: string | null;
      /** 있으면 그 일정의 대체 장소로 넣는다 */
      alternativeOf?: string | null;
    }) => createPlaceSchedule(tripId, v.dayIndex, v.place, v.emoji, v.alternativeOf ?? null),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: queryKeys.savedPlaces(tripId) });
    },
  });
}

/** 「저장한 장소」 — 이 여행 도시의 내 장소. 사용자 · 도시를 모르면 기다린다 */
export function useSavedPlaces(tripId: string, userId: string | undefined, cityIds: string[]) {
  return useQuery({
    queryKey: [...queryKeys.savedPlaces(tripId), userId, cityIds],
    queryFn: () => fetchSavedPlaces(userId ?? "", cityIds),
    enabled: !!userId,
  });
}

/**
 * 장소 정보를 고친다. 이 장소를 쓰는 모든 일정에 반영된다(만든 사람만).
 * 이름 · 위치가 바뀔 수 있어 일정 추가 화면의 「저장한 장소」 목록도 다시 읽는다
 */
export function useUpdatePlace(tripId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"places"> }) =>
      updatePlace(id, patch),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: queryKeys.savedPlaces(tripId) });
    },
  });
}

export function useUpdateScheduleItem(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"schedule_items"> }) =>
      updateScheduleItem(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteScheduleItem(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({ mutationFn: deleteScheduleItem, onSuccess: invalidate });
}

/** 위/아래 이동: 낙관적으로 순서를 바꾸고 서버에 swap */
export function useSwapScheduleItems(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.scheduleItems(tripId);
  return useMutation({
    mutationFn: ({ a, b }: { a: ScheduleItem; b: ScheduleItem }) => swapScheduleItems(a, b),
    onMutate: async ({ a, b }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ScheduleItem[]>(key);
      qc.setQueryData<ScheduleItem[]>(key, (items = []) =>
        items
          .map((it) => {
            if (it.id === a.id) return { ...it, position: b.position };
            if (it.id === b.id) return { ...it, position: a.position };
            return it;
          })
          .sort((x, y) => x.day_index - y.day_index || x.position - y.position),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
    },
  });
}

export function useMoveScheduleItemToDay(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ item, dayIndex }: { item: ScheduleItem; dayIndex: number }) =>
      moveScheduleItemToDay(item, dayIndex),
    onSuccess: invalidate,
  });
}

/** 날짜 메모를 그날 끝에 넣는다(note 일정) */
export function useAddDayMemo(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ dayIndex, text }: { dayIndex: number; text: string }) =>
      addDayMemo(tripId, dayIndex, text),
    onSuccess: invalidate,
  });
}

/** 일정 편집 「완료」 저장. 일정 · 대체 장소(날짜가 따라 바뀐다) · 경로 · 이동 기록을 다시 읽는다 */
export function useApplyScheduleEdit(tripId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ days, deletes }: { days: Record<number, string[]>; deletes: string[] }) =>
      applyScheduleEdit(tripId, days, deletes),
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: queryKeys.moves(tripId) });
    },
  });
}
