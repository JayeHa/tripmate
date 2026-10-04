"use client";

import { useState } from "react";

import { type ScheduleItem, useUpdateScheduleItem } from "@/entities/schedule-item";

import { type PlanDraft, planDraftOf, toPlanPatch } from "../lib/detail";

/**
 * 「이번 일정」 그 자리 수정 — 예약 상태 · 시간 · 일정 링크(note · flight 는 제목 · 시간).
 * 수정을 누르면 지금 값으로 칸을 채우고, 저장하면 닫는다. 저장 중에는 다시 누르지 못한다.
 */
export function usePlanEdit(tripId: string, item: ScheduleItem) {
  const update = useUpdateScheduleItem(tripId);
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 수정 칸을 연다 — 지금 값으로 */
  function start() {
    update.reset();
    setError(null);
    setDraft(planDraftOf(item));
  }

  /** 고친 것을 버리고 닫는다 */
  function cancel() {
    setDraft(null);
    setError(null);
  }

  /** 검증해 저장하고 닫는다 */
  function save() {
    if (!draft || update.isPending) return;
    const result = toPlanPatch(item, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    update.mutate({ id: item.id, patch: result.patch }, { onSuccess: cancel });
  }

  return {
    draft,
    /** 칸 하나를 고친다 */
    set: <K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) =>
      setDraft((d) => (d ? { ...d, [key]: value } : d)),
    start,
    cancel,
    save,
    saving: update.isPending,
    error: error ?? (update.error ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null),
  };
}

export type PlanEditState = ReturnType<typeof usePlanEdit>;
