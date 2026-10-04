"use client";

import {
  type ScheduleItem,
  useDeleteScheduleItem,
  useMoveScheduleItemToDay,
  useSwapScheduleItems,
} from "@/entities/schedule-item";

/**
 * 상세 머리 ⋯ 메뉴의 동작 — 앞으로 · 뒤로(그날 안에서 이웃과 자리 바꾸기) · 다른 날로 이동 · 삭제.
 * 편집 모드(드래그 · 날짜 이동, #13 ⑤)가 생기기 전까지 임시로 여기에 둔다. 이동 · 삭제가 끝나면 상세를 닫는다.
 */
export function useItemActions(
  tripId: string,
  item: ScheduleItem,
  dayItems: ScheduleItem[],
  onDone: () => void,
) {
  const remove = useDeleteScheduleItem(tripId);
  const swap = useSwapScheduleItems(tripId);
  const moveDay = useMoveScheduleItemToDay(tripId);
  const index = dayItems.findIndex((it) => it.id === item.id);

  /** 그날 안에서 이웃과 자리를 바꾼다. 끝이거나 이동 중이면 undefined(메뉴 항목 비활성) */
  const swapWith = (offset: -1 | 1) => {
    const neighbor = dayItems[index + offset] as ScheduleItem | undefined;
    if (index < 0 || !neighbor || swap.isPending) return undefined;
    return () => swap.mutate({ a: dayItems[index], b: neighbor });
  };

  return {
    moveUp: swapWith(-1),
    moveDown: swapWith(1),
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
