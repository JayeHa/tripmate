import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import {
  isNetworkError,
  notifySync,
  OVERWROTE_TEXT,
  retrySync,
  SYNC_KEY,
  SYNC_SCOPE,
} from "@/shared/api/sync";

import { saveVisitNote } from "../api/visit-notes";
import type { VisitNote } from "./visit-note";

/** 기록 글 저장 — 오프라인 대기열(SYNC_KEY) */
export const VISIT_NOTE_KEY = [SYNC_KEY, "visit-note"] as const;

/** 일행이 그사이 고친 기록 글을 지웠을 때의 알림 */
const DELETED_NOTE_TEXT = "일행이 먼저 고친 기록을 지웠어요";

/** 기록 글 저장의 값 — 기기에 남아 되살아나므로 여행 id 와 저장한 시각 · 본 버전까지 담는다. body 가 비면 지우기 */
export type VisitNoteVars = {
  tripId: string;
  itemId: string;
  /** 앞뒤 공백을 뗀 글(cleanNoteBody) */
  body: string;
  /** 나 — 화면을 먼저 바꿀 때 고친 사람으로 적는다(서버에는 보내지 않는다, DB 가 나로 채운다) */
  userId: string;
  /** 저장한 시각(ISO) */
  at: string;
  /** 고치기 시작할 때 본 글의 updated_at. 글이 없었으면 null — 그사이 일행이 고쳤는지 서버가 이것으로 가린다 */
  seen: string | null;
};

/**
 * 기록 글 저장의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 화면을 먼저 바꾸고 올리며, 일정이 키라 다시 올려도 같다. 글은 일행이 함께 써서 나중 저장이 이긴다 —
 * 그사이 일행이 고친 글을 덮었으면 동기화 칩 옆에 알린다.
 * 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남기고, 그 밖의 실패는 다시 읽어 되돌린다
 */
export function registerVisitNoteSync(qc: QueryClient): void {
  qc.setMutationDefaults(VISIT_NOTE_KEY, {
    scope: SYNC_SCOPE,
    retry: retrySync,
    // 실패한 저장이 5분 뒤 사라지면 「저장 실패 · 다시 시도」 도 함께 사라져 변경을 잃는다 — 다시 시도할 때 지운다
    gcTime: Infinity,
    // 앞 버전의 앱이 기기에 남긴 저장에는 seen 이 없다 — 본 글이 없던 것으로 올린다
    mutationFn: (v: VisitNoteVars) => saveVisitNote({ ...v, seen: v.seen ?? null }),
    onMutate: async (v: VisitNoteVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.visitNotes(v.tripId) });
      qc.setQueryData<VisitNote[]>(queryKeys.visitNotes(v.tripId), (rows) => {
        if (!rows) return rows;
        const rest = rows.filter((r) => r.item_id !== v.itemId);
        if (!v.body) return rest;
        return [
          ...rest,
          {
            item_id: v.itemId,
            trip_id: v.tripId,
            updated_by: v.userId,
            body: v.body,
            updated_at: v.at,
          },
        ];
      });
    },
    onSuccess: (overwrote: boolean, v: VisitNoteVars) => {
      if (overwrote) notifySync(v.body ? OVERWROTE_TEXT : DELETED_NOTE_TEXT);
    },
    onSettled: (_d, error, v: VisitNoteVars) => {
      // 서버에 닿지 못해 실패했으면 다시 읽지 않는다 — 읽기만 되면 내 글이 서버 값으로 풀려 보인다
      if (error && isNetworkError(error)) return;
      if (qc.isMutating({ mutationKey: VISIT_NOTE_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.visitNotes(v.tripId) });
      }
    },
  });
}
