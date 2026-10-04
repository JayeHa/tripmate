"use client";

import {
  type ScheduleItem,
  useDeleteScheduleItem,
  useMoveScheduleItemToDay,
  useSwapScheduleItems,
  useUpdatePlace,
  useUpdateScheduleItem,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
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
 * 이름은 place 면 장소 이름(만든 사람만, 이 장소를 쓰는 모든 일정에 반영), note · flight 면 일정 제목이다.
 */
export function ItemEditSheet({
  tripId,
  startDate,
  totalDays,
  editing,
  dayItems,
  onClose,
}: ItemEditSheetProps) {
  const { data: user } = useUser();
  const update = useUpdateScheduleItem(tripId);
  const updatePlace = useUpdatePlace(tripId);
  const place = editing?.place ?? null;
  const canEditName = !place || (!!user && place.created_by === user.id);
  // 일정 칸은 저장됐는데 장소 이름만 실패할 수 있다 — 무엇이 저장됐는지 알려 준다
  const saveError =
    (update.error && "저장하지 못했어요. 잠시 후 다시 시도해 주세요.") ??
    (updatePlace.error && "일정은 저장했지만 장소 이름은 바꾸지 못했어요.");
  const remove = useDeleteScheduleItem(tripId);
  const swap = useSwapScheduleItems(tripId);
  const moveDay = useMoveScheduleItemToDay(tripId);

  /** 시트를 닫는다. 어떤 경로로 닫든(취소 · 저장 · 날짜 이동 · 삭제) 지난 저장 오류를 지워 다음 일정에 남지 않게 */
  function close() {
    update.reset();
    updatePlace.reset();
    onClose();
  }

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
      canEditName={canEditName}
      saveError={saveError}
      startDate={startDate}
      totalDays={totalDays}
      pending={update.isPending || updatePlace.isPending}
      onClose={close}
      onSave={({ name, ...patch }) => {
        if (!editing) return;
        // 일정 칸을 먼저 저장하고, 장소 이름이 바뀌었으면 장소를 고친 뒤 닫는다
        const renamePlace = place && canEditName && name !== place.name;
        update.mutate(
          { id: editing.id, patch: place ? patch : { ...patch, name } },
          {
            onSuccess: () => {
              if (!renamePlace) return close();
              updatePlace.mutate({ id: place.id, patch: { name } }, { onSuccess: close });
            },
          },
        );
      }}
      onMoveDay={(dayIndex) => {
        if (!editing || dayIndex === editing.day_index) return;
        moveDay.mutate({ item: editing, dayIndex }, { onSuccess: close });
      }}
      onMoveUp={swapWith(-1)}
      onMoveDown={swapWith(1)}
      onDelete={() => {
        if (!editing) return;
        remove.mutate(editing.id, { onSuccess: close });
      }}
    />
  );
}
