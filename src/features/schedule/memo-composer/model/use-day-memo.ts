"use client";

import { useState } from "react";

import { useAddDayMemo } from "@/entities/schedule-item";
import { useMountedDone } from "@/shared/lib/use-mounted-done";

import { toDayMemoText } from "../lib/day-memo";

/**
 * 날짜 메모 쓰기 — 고른 날(「변경 ⌄」 으로 바꾼다)의 맨 끝에 note 일정 한 줄. ☆/★ 중요는 글 앞 「★ 」 로 남긴다.
 * 링크는 받지 않는다(날짜 메모는 제목 한 칸)
 */
export function useDayMemo(tripId: string, initialDay: number, onDone: () => void) {
  const [dayIndex, setDayIndex] = useState(initialDay);
  const [body, setBody] = useState("");
  const [starred, setStarred] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const add = useAddDayMemo(tripId);
  const finish = useMountedDone(onDone);

  /** 검증해 그날 끝에 넣는다 */
  function save() {
    if (add.isPending) return;
    const result = toDayMemoText(body, starred);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    void add.mutateAsync({ dayIndex, text: result.text }).then(finish, () => undefined);
  }

  return {
    dayIndex,
    setDayIndex,
    body,
    setBody,
    starred,
    toggleStar: () => setStarred((s) => !s),
    save,
    pending: add.isPending,
    canSave: body.trim().length > 0,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: add.isPending && !add.isPaused,
    error: error ?? (add.error ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null),
  };
}
