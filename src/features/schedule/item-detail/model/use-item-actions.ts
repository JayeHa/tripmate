"use client";

import {
  type ScheduleItem,
  useDeleteScheduleItem,
  useMoveScheduleItemToDay,
} from "@/entities/schedule-item";
import { saveErrorText } from "@/shared/api/sync";

/**
 * 상세 머리 ⋯ 메뉴의 동작 — 다른 날로 이동 · 삭제. 순서 바꾸기는 일정 편집에서 한다.
 * 이동 · 삭제가 끝나면 알릴 문구(「day 3로 옮겼어요」 · 「일정을 삭제했어요」)와 함께 onDone 을 부른다 — 부른 쪽이 상세를 닫고 토스트를 띄운다.
 */
export function useItemActions(
  tripId: string,
  item: ScheduleItem,
  onDone: (message: string) => void,
) {
  const remove = useDeleteScheduleItem(tripId);
  const moveDay = useMoveScheduleItemToDay(tripId);
  return {
    /** 다른 날 끝으로 옮긴다. 같은 날이면 아무것도 하지 않는다 */
    moveTo: (dayIndex: number) => {
      if (dayIndex === item.day_index || moveDay.isPending) return;
      moveDay.mutate(
        { item, dayIndex },
        { onSuccess: () => onDone(`day ${dayIndex + 1}로 옮겼어요`) },
      );
    },
    remove: () => {
      if (remove.isPending) return;
      remove.mutate(item.id, { onSuccess: () => onDone("일정을 삭제했어요") });
    },
    pending: remove.isPending || moveDay.isPending,
    /** 이동 · 삭제 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 상세를 닫지 못하게 */
    locked: [remove, moveDay].some((m) => m.isPending && !m.isPaused),
    error: errorText(remove.error ?? moveDay.error),
  };
}

export type ItemActions = ReturnType<typeof useItemActions>;

/** 이동 · 삭제 실패 문구. 실패가 없으면 null */
function errorText(error: Error | null): string | null {
  return error ? saveErrorText(error, "처리하지 못했어요. 잠시 후 다시 시도해 주세요.") : null;
}
