"use client";

import { useState } from "react";

import { useAddDayMemo } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { saveErrorText } from "@/shared/api/sync";
import { useMountedDone } from "@/shared/lib/use-mounted-done";

import { type NoteDraft, noteDraftOf, toNewNote } from "../lib/day-memo";

/**
 * 새 날짜 메모 — 고른 날(창 머리의 「변경 ⌄」 으로 바꾼다)에 note 일정 한 줄. 시간이 없으면 그날 맨 아래, 있으면 그 시각 자리.
 * 중요는 글 앞 「★ 」 로 남기고, 「홈에 고정」 이면 고정한 사람(나)을 적는다
 */
export function useDayMemo(tripId: string, dayIndex: number, onDone: () => void) {
  const [draft, setDraft] = useState<NoteDraft>(() => noteDraftOf(null));
  const { data: user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const add = useAddDayMemo(tripId);
  const finish = useMountedDone(onDone);

  /** 검증해 넣는다 */
  function save() {
    if (add.isPending) return;
    const result = toNewNote(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    const pinnedBy = draft.pinned ? (user?.id ?? null) : null;
    void add.mutateAsync({ dayIndex, ...result.value, pinnedBy }).then(finish, () => undefined);
  }

  return {
    draft,
    /** 칸 하나를 고친다 */
    set: <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    /** 「홈에 고정」 을 누를 수 있다 — 고정한 사람(나)을 알아야 적는다 */
    pinReady: !!user,
    save,
    pending: add.isPending,
    canSave: draft.body.trim().length > 0,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: add.isPending && !add.isPaused,
    error:
      error ??
      (add.error
        ? saveErrorText(add.error, "저장하지 못했어요. 잠시 후 다시 시도해 주세요.")
        : null),
  };
}
