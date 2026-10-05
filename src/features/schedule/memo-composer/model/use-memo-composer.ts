"use client";

import { useState } from "react";

import {
  type Memo,
  MEMO_GONE,
  type ScheduleItem,
  useCreateMemo,
  useDeleteMemo,
  useUpdateMemo,
} from "@/entities/schedule-item";

import { type MemoDraft, memoDraftOf, samePayload, toMemoPayload } from "../lib/memo-draft";
import { useMountedDone } from "./use-mounted-done";

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
 * 열릴 때마다 새로 마운트돼 처음 값에서 시작한다. 저장 · 삭제는 mutateAsync 로 받고, 끝났을 때 이 창이
 * 아직 떠 있으면 닫는다(오프라인으로 멈춘 동안 창을 닫고 다른 메모를 열었으면 그 창은 건드리지 않는다)
 */
export function useMemoComposer({ tripId, item, memo, onDone }: MemoComposerOptions) {
  const [draft, setDraft] = useState<MemoDraft>(() => memoDraftOf(memo));
  const [error, setError] = useState<string | null>(null);
  const create = useCreateMemo(tripId);
  const update = useUpdateMemo(tripId);
  const remove = useDeleteMemo(tripId);
  const mutations = [create, update, remove];
  const pending = mutations.some((m) => m.isPending);
  // 저장 · 삭제가 끝났을 때 이 창이 아직 떠 있을 때만 닫는다(늦게 끝난 요청이 다른 메모 창을 닫지 않게)
  const finish = useMountedDone(onDone);

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
    // 고치기에서 연 때와 같으면 보내지 않는다 — 보기만 하고 「저장」 해도 그사이 일행이 고친 글을 덮지 않게
    const opened = memo && toMemoPayload(memoDraftOf(memo));
    if (opened?.ok && samePayload(opened.value, result.value)) {
      onDone();
      return;
    }
    const done = memo
      ? update.mutateAsync({ id: memo.id, patch: result.value })
      : create.mutateAsync({ trip_id: tripId, schedule_item_id: item.id, ...result.value });
    void done.then(finish, () => undefined);
  }

  /** 고치는 메모를 지운다 */
  function destroy() {
    if (!memo || pending) return;
    void remove.mutateAsync(memo.id).then(finish, () => undefined);
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
    error: error ?? errorOf(mutations.map((m) => m.error).find(Boolean)),
  };
}

/** 요청 실패 문구 — 그사이 지워진 메모면 그대로 알리고, 그 밖은 다시 시도 */
function errorOf(e: unknown): string | null {
  if (!e) return null;
  if (e instanceof Error && e.message === MEMO_GONE) return MEMO_GONE;
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export type MemoComposerState = ReturnType<typeof useMemoComposer>;
