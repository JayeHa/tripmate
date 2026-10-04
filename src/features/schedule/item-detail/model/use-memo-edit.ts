"use client";

import { useState } from "react";

import { type ScheduleItem, useUpdateScheduleItem } from "@/entities/schedule-item";

/** 메모 한 칸의 최대 길이 */
const MEMO_MAX = 500;

/**
 * 일정 메모(schedule_items.memo) 그 자리 수정. 메모 목록(작성자 · ★ · 링크)은 ④ 에서 바뀌고,
 * 그 전까지는 한 칸을 줄 단위로 적는다(카드는 줄마다 · 로 보인다).
 */
export function useMemoEdit(tripId: string, item: ScheduleItem) {
  const update = useUpdateScheduleItem(tripId);
  const [text, setText] = useState<string | null>(null);

  /** 저장하고 닫는다. 비우면 메모를 지운다 */
  function save() {
    if (text === null || update.isPending) return;
    const memo = text.trim().slice(0, MEMO_MAX) || null;
    update.mutate({ id: item.id, patch: { memo } }, { onSuccess: () => setText(null) });
  }

  return {
    /** 수정 중인 글. null 이면 보기 상태 */
    text,
    setText,
    start: () => {
      update.reset();
      setText(item.memo ?? "");
    },
    cancel: () => setText(null),
    save,
    saving: update.isPending,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 상세를 닫지 못하게 */
    locked: update.isPending && !update.isPaused,
    error: update.error ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null,
  };
}

export type MemoEditState = ReturnType<typeof useMemoEdit>;
