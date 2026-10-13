"use client";

import { openChecklistFor } from "../lib/by-target";
import type { ChecklistItem, ChecklistTargetRef } from "./types";
import { useChecklistIndex, usePendingChecklistIds, useSetChecklistStatus } from "./use-checklist";

/**
 * 일정 · 항공편 · 숙소 상세의 체크리스트 칸 — 그 대상들에 연결된 끝나지 않은 항목(마감순)과 완료 체크.
 * 완료하면 칸에서 빠지고 「완료했어요」, 실패하면 돌아오고 알린다. 같은 항목을 연달아 누르면 앞 요청이 끝날 때까지 무시한다
 */
export function useLinkedChecklist(
  tripId: string,
  refs: ChecklistTargetRef[],
  onToast: (message: string) => void,
): { items: ChecklistItem[]; complete: (id: string) => void } {
  const index = useChecklistIndex(tripId);
  const setStatus = useSetChecklistStatus(tripId);
  const pending = usePendingChecklistIds(tripId);

  /** 완료로 표시 */
  function complete(id: string) {
    if (pending.includes(id)) return;
    void setStatus
      .mutateAsync({ id, status: "done" })
      .then(() => onToast("완료했어요"))
      .catch(() => onToast("바꾸지 못했어요. 다시 시도해 주세요"));
  }

  return { items: openChecklistFor(index, refs), complete };
}
