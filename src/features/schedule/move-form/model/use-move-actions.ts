"use client";

import { type MoveMode, useDeleteMove, useSaveMove } from "@/entities/schedule-item";

type PairIds = { fromItemId: string; toItemId: string };

/**
 * 이동 방법 창의 저장 · 지우기. 창이 닫히지 않게 할지(locked)와 보여 줄 오류를 한 곳에서 정한다.
 * - 요청이 서버에 가 있는 동안은 잠근다. 닫힌 뒤 실패하면 사용자가 모른다
 * - 오프라인이면 뮤테이션이 실패하지 않고 멈춘다(paused). 그때 잠그면 창을 못 닫으므로 잠그지 않고 안내만 한다
 * - 한 동작을 시작하면 다른 동작의 오류를 지워, 마지막 동작의 오류만 그 동작의 문구로 보인다
 */
export function useMoveActions(tripId: string) {
  const save = useSaveMove(tripId);
  const remove = useDeleteMove(tripId);
  const pending = save.isPending || remove.isPending;
  const paused = save.isPaused || remove.isPaused;

  /** 수단 · 상세를 저장한다. 둘 다 비었으면 지우기로 처리한다 */
  function submit(ids: PairIds, mode: MoveMode | null, detail: string, onDone: () => void) {
    const trimmed = detail.trim();
    if (!mode && !trimmed) {
      erase(ids, onDone);
      return;
    }
    remove.reset();
    save.mutate({ ...ids, mode, detail: trimmed || null }, { onSuccess: onDone });
  }

  /** 기록을 지운다 */
  function erase(ids: PairIds, onDone: () => void) {
    save.reset();
    remove.mutate(ids, { onSuccess: onDone });
  }

  const error =
    (save.error && `저장하지 못했어요: ${save.error.message}`) ||
    (remove.error && `지우지 못했어요: ${remove.error.message}`) ||
    null;

  /** 창을 닫을 때 지난 오류를 지운다. 창은 마운트된 채라 다음에 열면 남아 있다 */
  function reset() {
    save.reset();
    remove.reset();
  }

  return { submit, erase, reset, pending, paused, locked: pending && !paused, error };
}
