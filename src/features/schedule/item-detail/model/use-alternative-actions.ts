"use client";

import {
  type ScheduleItem,
  useAddAlternative,
  useDeleteScheduleItem,
  useSwapAlternative,
} from "@/entities/schedule-item";

/**
 * 대체 장소 동작 — 저장한 장소 붙이기 · 「바꾸기」 · 지우기.
 * 바꾸기가 끝나면(새 목록까지 받은 뒤) `onSwapped(altId)` 로 새로 그 자리에 들어온 줄을 알린다 — 상세가 그 줄로 옮겨 가야
 * 원래 줄(이제 대체 장소)이 타임라인에서 빠지며 상세가 닫히지 않는다.
 * mutateAsync 를 쓴다: 호출 단위 콜백은 그사이 상세가 닫혀(언마운트) 버리면 실행되지 않는다
 */
export function useAlternativeActions(
  tripId: string,
  main: ScheduleItem,
  onSwapped: (altId: string) => void,
) {
  const add = useAddAlternative(tripId);
  const swap = useSwapAlternative(tripId);
  const remove = useDeleteScheduleItem(tripId);
  const mutations = [add, swap, remove];
  const pending = mutations.some((m) => m.isPending);

  /** 앞선 실패 문구를 지운다 — 다른 동작을 시작할 때 */
  const resetAll = () => mutations.forEach((m) => m.reset());

  return {
    /** 저장한 장소를 대체 장소로 붙인다. 붙었으면 true */
    addSaved: async (placeId: string) => {
      if (pending) return false;
      resetAll();
      return add.mutateAsync({ main, placeId }).then(
        () => true,
        () => false,
      );
    },
    swap: (alt: ScheduleItem) => {
      if (pending) return;
      resetAll();
      void swap.mutateAsync(alt.id).then(
        () => onSwapped(alt.id),
        () => undefined,
      );
    },
    remove: (alt: ScheduleItem) => {
      if (pending) return;
      resetAll();
      remove.mutate(alt.id);
    },
    pending,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 상세를 닫지 못하게 */
    locked: mutations.some((m) => m.isPending && !m.isPaused),
    error: mutations.some((m) => m.error) ? "처리하지 못했어요. 잠시 후 다시 시도해 주세요." : null,
  };
}

export type AlternativeActions = ReturnType<typeof useAlternativeActions>;
