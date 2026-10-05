"use client";

import { useState } from "react";

import {
  type Memo,
  type ScheduleItem,
  useCreateMemo,
  useDeleteMemo,
  useUpdateMemo,
} from "@/entities/schedule-item";

import { type MemoDraft, memoDraftOf, toMemoPayload } from "../lib/memo-draft";

type MemoComposerOptions = {
  tripId: string;
  /** 메모를 붙일 일정 */
  item: ScheduleItem;
  /** 고치는 메모. 새로 쓰면 null */
  memo: Memo | null;
  /** 저장 · 삭제가 끝나면 부른다(창은 부른 쪽이 닫는다) */
  onDone: () => void;
};

/**
 * 메모 작성 · 수정 — 본문(500자) · ★ 중요 · 링크. 여행 멤버 누구나 고치고 지운다(0027).
 * 열릴 때마다 새로 마운트돼 처음 값에서 시작한다. 저장 · 삭제는 mutateAsync 로 받아,
 * 그사이 창이 닫혀도(오프라인으로 멈춘 동안) 완료를 알린다
 */
export function useMemoComposer({ tripId, item, memo, onDone }: MemoComposerOptions) {
  const [draft, setDraft] = useState<MemoDraft>(() => memoDraftOf(memo));
  const [error, setError] = useState<string | null>(null);
  const create = useCreateMemo(tripId);
  const update = useUpdateMemo(tripId);
  const remove = useDeleteMemo(tripId);
  const mutations = [create, update, remove];
  const pending = mutations.some((m) => m.isPending);

  /** 칸 하나를 고친다 */
  function set<K extends keyof MemoDraft>(key: K, value: MemoDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  /** 검증해 저장한다(새 메모면 만들고, 아니면 고친다) */
  function save() {
    if (pending) return;
    const result = toMemoPayload(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    const done = memo
      ? update.mutateAsync({ id: memo.id, patch: result.value })
      : create.mutateAsync({ trip_id: tripId, schedule_item_id: item.id, ...result.value });
    void done.then(onDone, () => undefined);
  }

  /** 고치는 메모를 지운다 */
  function destroy() {
    if (!memo || pending) return;
    void remove.mutateAsync(memo.id).then(onDone, () => undefined);
  }

  return {
    draft,
    set,
    /** 「링크」 — 빈 링크 줄을 하나 더한다 */
    addLink: () => set("links", [...draft.links, { title: "", url: "" }]),
    save,
    destroy,
    editing: !!memo,
    pending,
    canSave: draft.body.trim().length > 0,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: mutations.some((m) => m.isPending && !m.isPaused),
    error:
      error ??
      (mutations.some((m) => m.error) ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null),
  };
}

export type MemoComposerState = ReturnType<typeof useMemoComposer>;
