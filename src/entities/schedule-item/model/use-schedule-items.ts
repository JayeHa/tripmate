"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import type { TablesUpdate } from "@/shared/api/supabase/database.types";

import {
  addPlaceToSchedule,
  deleteScheduleItem,
  fetchScheduleItems,
  moveScheduleItemToDay,
  type PickedPlaceInput,
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

/** 장소를 그날 끝에 담는다(장소 + 일정) */
export function useAddPlaceToSchedule(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ dayIndex, place }: { dayIndex: number; place: PickedPlaceInput }) =>
      addPlaceToSchedule(tripId, dayIndex, place),
    onSuccess: invalidate,
  });
}

/** 장소 정보를 고친다. 이 장소를 쓰는 모든 일정에 반영된다(만든 사람만) */
export function useUpdatePlace(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"places"> }) =>
      updatePlace(id, patch),
    onSuccess: invalidate,
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
