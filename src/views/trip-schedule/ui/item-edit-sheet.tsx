"use client";

import {
  type ScheduleItem,
  useDeleteScheduleItem,
  useMoveScheduleItemToDay,
  useSwapScheduleItems,
  useUpdateScheduleItem,
} from "@/entities/schedule-item";
import { ScheduleItemForm } from "@/features/schedule/item-form";

type ItemEditSheetProps = {
  tripId: string;
  startDate: string;
  totalDays: number;
  /** 고치는 일정. null 이면 닫혀 있다 */
  editing: ScheduleItem | null;
  /** 그날 일정(position 순). 앞으로 · 뒤로가 이웃을 찾는다 */
  dayItems: ScheduleItem[];
  onClose: () => void;
};

/**
 * 일정 편집 시트와 그 동작(저장 · 날짜 이동 · 순서 · 삭제). 장소 상세가 생기기 전까지 카드를 누르면 열린다.
 * 순서는 편집 모드(드래그)가 생기기 전까지 여기의 「앞으로 / 뒤로」로 바꾼다. 이동 중에는 막는다.
 */
export function ItemEditSheet({
  tripId,
  startDate,
  totalDays,
  editing,
  dayItems,
  onClose,
}: ItemEditSheetProps) {
  const update = useUpdateScheduleItem(tripId);
  const remove = useDeleteScheduleItem(tripId);
  const swap = useSwapScheduleItems(tripId);
  const moveDay = useMoveScheduleItemToDay(tripId);

  const index = editing ? dayItems.findIndex((it) => it.id === editing.id) : -1;
  const canReorder = index >= 0 && !swap.isPending;
  /** 그날 안에서 이웃과 자리를 바꾼다. 끝이면 undefined(버튼 비활성) */
  const swapWith = (offset: -1 | 1) => {
    const neighbor = dayItems[index + offset] as ScheduleItem | undefined;
    if (!canReorder || !neighbor) return undefined;
    return () => swap.mutate({ a: dayItems[index], b: neighbor });
  };

  return (
    <ScheduleItemForm
      item={editing}
      startDate={startDate}
      totalDays={totalDays}
      pending={update.isPending}
      onClose={onClose}
      onSave={(patch) => {
        if (!editing) return;
        update.mutate({ id: editing.id, patch }, { onSuccess: onClose });
      }}
      onMoveDay={(dayIndex) => {
        if (!editing || dayIndex === editing.day_index) return;
        moveDay.mutate({ item: editing, dayIndex }, { onSuccess: onClose });
      }}
      onMoveUp={swapWith(-1)}
      onMoveDown={swapWith(1)}
      onDelete={() => {
        if (!editing) return;
        remove.mutate(editing.id, { onSuccess: onClose });
      }}
    />
  );
}
