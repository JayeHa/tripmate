"use client";

import {
  type ScheduleItem,
  useDeleteScheduleItem,
  useMoveScheduleItemToDay,
} from "@/entities/schedule-item";

/**
 * 상세 머리 ⋯ 메뉴의 동작 — 다른 날로 이동 · 삭제. 순서 바꾸기는 일정 편집에서 한다.
 * 이동 · 삭제가 끝나면 상세를 닫는다.
 */
export function useItemActions(tripId: string, item: ScheduleItem, onDone: () => void) {
  const remove = useDeleteScheduleItem(tripId);
  const moveDay = useMoveScheduleItemToDay(tripId);
  return {
    /** 다른 날 끝으로 옮긴다. 같은 날이면 아무것도 하지 않는다 */
    moveTo: (dayIndex: number) => {
      if (dayIndex === item.day_index || moveDay.isPending) return;
      moveDay.mutate({ item, dayIndex }, { onSuccess: onDone });
    },
    remove: () => {
      if (remove.isPending) return;
      remove.mutate(item.id, { onSuccess: onDone });
    },
    pending: remove.isPending || moveDay.isPending,
    /** 이동 · 삭제 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 상세를 닫지 못하게 */
    locked: [remove, moveDay].some((m) => m.isPending && !m.isPaused),
    error: remove.error || moveDay.error ? "처리하지 못했어요. 잠시 후 다시 시도해 주세요." : null,
  };
}

export type ItemActions = ReturnType<typeof useItemActions>;
