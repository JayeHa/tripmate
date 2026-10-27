"use client";

import { useState } from "react";

import {
  type ScheduleItem,
  useDeleteScheduleItem,
  useUpdateScheduleItem,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useMountedDone } from "@/shared/lib/use-mounted-done";

import { type NoteDraft, noteDraftOf, toNotePatch } from "../lib/day-memo";
import { pinnedByOf } from "../lib/memo-draft";

/**
 * 날짜 메모 고치기 — 시간(선택) · 글 · 홈에 고정. 연 때와 달라진 칸만 저장하고, 바뀐 게 없으면 그냥 닫는다. 지우기도 여기서.
 * 열릴 때마다 새로 마운트돼 그때 값에서 시작한다
 */
export function useNoteEdit(tripId: string, item: ScheduleItem, onDone: () => void) {
  const [initial] = useState(() => noteDraftOf(item));
  const [draft, setDraft] = useState<NoteDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useUser();
  const update = useUpdateScheduleItem(tripId);
  const remove = useDeleteScheduleItem(tripId);
  const finish = useMountedDone(onDone);
  const pending = update.isPending || remove.isPending;

  /** 검증해 바뀐 칸만 저장한다 */
  function save() {
    if (pending) return;
    // 고정 칩은 나를 알기 전에는 막혀 있다(pinReady) — 새로 고정하려면 user 가 있다
    const pinnedBy = pinnedByOf(draft.pinned, item.pinned_by, user?.id ?? "");
    const result = toNotePatch(draft, initial, pinnedBy);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    if (Object.keys(result.patch).length === 0) {
      onDone();
      return;
    }
    void update.mutateAsync({ id: item.id, patch: result.patch }).then(finish, () => undefined);
  }

  return {
    draft,
    /** 칸 하나를 고친다 */
    set: <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    save,
    destroy: () => {
      if (pending) return;
      void remove.mutateAsync(item.id).then(finish, () => undefined);
    },
    pending,
    /** 「홈에 고정」 을 누를 수 있다 — 고정한 사람(나)을 알아야 적는다 */
    pinReady: !!user,
    canSave: draft.text.trim().length > 0,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: [update, remove].some((m) => m.isPending && !m.isPaused),
    error:
      error ??
      (update.error || remove.error ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null),
  };
}
