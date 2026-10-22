"use client";

import { openChecklistFor } from "../lib/by-target";
import type { ChecklistItem, ChecklistTargetRef } from "./types";
import { useChecklistIndex, useSetChecklistStatus } from "./use-checklist";

/**
 * 일정 · 항공편 · 숙소 상세의 체크리스트 칸 — 그 대상들에 연결된 끝나지 않은 항목(마감순)과 완료 체크.
 * 완료하면 칸에서 빠지고 바로 「완료했어요」(오프라인이면 연결되어 올라갈 때까지 기다리지 않는다), 실패하면 돌아오고 알린다
 */
export function useLinkedChecklist(
  tripId: string,
  refs: ChecklistTargetRef[],
  onToast: (message: string) => void,
): { items: ChecklistItem[]; complete: (id: string) => void } {
  const index = useChecklistIndex(tripId);
  const setStatus = useSetChecklistStatus(tripId);

  /** 완료로 표시 */
  function complete(id: string) {
    onToast("완료했어요");
    void setStatus
      .mutateAsync({ id, status: "done" })
      .catch(() => onToast("바꾸지 못했어요. 다시 시도해 주세요"));
  }

  return { items: openChecklistFor(index, refs), complete };
}
