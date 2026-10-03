"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import {
  createScheduleItem,
  deleteScheduleItem,
  fetchScheduleItems,
  moveScheduleItemToDay,
  swapScheduleItems,
  updateScheduleItem,
  type NewScheduleItem,
} from "@/lib/queries/schedule-items";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { ScheduleItem } from "@/lib/types";

export function useScheduleItems(tripId: string) {
  return useQuery({
    queryKey: queryKeys.scheduleItems(tripId),
    queryFn: () => fetchScheduleItems(tripId),
  });
}

function useInvalidateItems(tripId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
    qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
  };
}

export function useCreateScheduleItem(tripId: string) {
  const invalidate = useInvalidateItems(tripId);
  return useMutation({
    mutationFn: (input: NewScheduleItem) => createScheduleItem(input),
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
          .map((it) =>
            it.id === a.id
              ? { ...it, position: b.position }
              : it.id === b.id
                ? { ...it, position: a.position }
                : it,
          )
          .sort((x, y) => x.day_index - y.day_index || x.position - y.position),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
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
