import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import {
  DELETED_EDITED_TEXT,
  dropFailedTwins,
  isNetworkError,
  notifySync,
  OVERWROTE_TEXT,
  rememberOwnWrite,
  retrySync,
  SYNC_KEY,
  SYNC_SCOPE,
  type SyncResult,
  versionToCompare,
} from "@/shared/api/sync";

import { createMemo, deleteMemo, updateMemo } from "../api/memos";
import type { Memo } from "./memo";

/** 메모 저장 셋의 공통 앞부분 — 셋 중 하나라도 진행 중인지 셀 때 */
const MEMO_KEY = [SYNC_KEY, "memo"] as const;
export const MEMO_CREATE_KEY = [...MEMO_KEY, "create"] as const;
export const MEMO_UPDATE_KEY = [...MEMO_KEY, "update"] as const;
export const MEMO_DELETE_KEY = [...MEMO_KEY, "delete"] as const;

/** 메모의 글 칸 — 본문 · ★ 중요 · 링크 · 홈에 고정한 사람(null 이면 고정 안 함) */
type MemoFields = {
  body: string;
  starred: boolean;
  links: { title: string; url: string }[];
  pinnedBy: string | null;
};

/** 메모 쓰기의 값 — id 는 화면에서 만든다(두 번 올라가도 하나). 작성자 · 쓴 때는 화면에 먼저 보일 값(서버는 트리거 · 기본값으로 채운다) */
export type MemoCreateVars = MemoFields & {
  tripId: string;
  id: string;
  itemId: string;
  authorId: string | null;
  createdAt: string;
};
/** 메모 고치기의 값 — version 은 열 때 본 그 메모의 updated_at */
export type MemoUpdateVars = MemoFields & { tripId: string; id: string; version: string };
/** 메모 지우기의 값 */
export type MemoDeleteVars = { tripId: string; id: string; version: string };

/**
 * 메모 쓰기 · 고치기 · 지우기의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 화면을 먼저 바꾸고 올린다. 그사이 일행이 고쳤으면 내 것으로 덮고 알린다(나중 수정 우선).
 * 실패하면 — 지워졌거나 권한이 없으면 그 메모만 되돌리고, 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남긴다.
 * 다시 읽기는 진행 중인 메모 저장이 다 끝났을 때 한 번만 한다
 */
export function registerMemoSync(qc: QueryClient): void {
  /** 캐시의 메모 목록을 바꾼다(아직 읽지 않았으면 그대로) */
  const setMemos = (tripId: string, change: (memos: Memo[]) => Memo[]) =>
    qc.setQueryData<Memo[]>(queryKeys.memos(tripId), (memos) => memos && change(memos));
  /** 바꾸기 전에 읽기를 멈추고 그 메모를 기억한다 */
  const snapshot = async (tripId: string, id: string) => {
    await qc.cancelQueries({ queryKey: queryKeys.memos(tripId) });
    return { before: qc.getQueryData<Memo[]>(queryKeys.memos(tripId))?.find((m) => m.id === id) };
  };
  /** 서버에 닿지 못한 실패가 아니고, 메모 저장이 이것뿐이면 다시 읽는다 */
  const settle = (error: unknown, tripId: string) => {
    if (error && isNetworkError(error)) return;
    if (qc.isMutating({ mutationKey: MEMO_KEY }) === 1) {
      void qc.invalidateQueries({ queryKey: queryKeys.memos(tripId) });
    }
  };
  const common = { scope: SYNC_SCOPE, retry: retrySync, gcTime: Infinity };

  qc.setMutationDefaults(MEMO_CREATE_KEY, {
    ...common,
    mutationFn: async (v: MemoCreateVars): Promise<void> => {
      const updatedAt = await createMemo({
        id: v.id,
        trip_id: v.tripId,
        schedule_item_id: v.itemId,
        body: v.body,
        starred: v.starred,
        links: v.links,
        pinned_by: v.pinnedBy,
      });
      // 이어서 고치거나 지우는 저장은 화면에 먼저 보인 버전(createdAt)을 들고 있다 — 서버 버전과 비교하게
      rememberOwnWrite(v.id, v.createdAt, updatedAt);
    },
    onMutate: async (v: MemoCreateVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.memos(v.tripId) });
      // 같은 창에서 다시 저장했으면(같은 id) 앞서 실패한 저장을 빼고 그 줄을 바꿔 끼운다 — 두 줄로 보이지 않게
      dropFailedTwins(qc, MEMO_CREATE_KEY, v.id);
      setMemos(v.tripId, (memos) => [...memos.filter((m) => m.id !== v.id), optimisticMemo(v)]);
    },
    onError: (error, v: MemoCreateVars) => {
      if (!isNetworkError(error)) setMemos(v.tripId, (memos) => memos.filter((m) => m.id !== v.id));
    },
    onSettled: (_d, error, v: MemoCreateVars) => settle(error, v.tripId),
  });

  qc.setMutationDefaults(MEMO_UPDATE_KEY, {
    ...common,
    mutationFn: async (v: MemoUpdateVars): Promise<SyncResult> => {
      const patch = { body: v.body, starred: v.starred, links: v.links, pinned_by: v.pinnedBy };
      const result = await updateMemo(v.id, patch, versionToCompare(v.id, v.version));
      rememberOwnWrite(v.id, v.version, result.updatedAt);
      return result;
    },
    onMutate: async (v: MemoUpdateVars) => {
      const ctx = await snapshot(v.tripId, v.id);
      const patch = { body: v.body, starred: v.starred, links: v.links, pinned_by: v.pinnedBy };
      setMemos(v.tripId, (memos) => memos.map((m) => (m.id === v.id ? { ...m, ...patch } : m)));
      return ctx;
    },
    onSuccess: (result: SyncResult, v: MemoUpdateVars) => {
      setMemos(v.tripId, (memos) =>
        memos.map((m) => (m.id === v.id ? { ...m, updated_at: result.updatedAt } : m)),
      );
      if (result.overwrote) notifySync(OVERWROTE_TEXT);
    },
    onError: (error, v: MemoUpdateVars, ctx: { before?: Memo } | undefined) => {
      const before = ctx?.before;
      if (isNetworkError(error) || !before) return;
      setMemos(v.tripId, (memos) => memos.map((m) => (m.id === v.id ? before : m)));
    },
    onSettled: (_d, error, v: MemoUpdateVars) => settle(error, v.tripId),
  });

  qc.setMutationDefaults(MEMO_DELETE_KEY, {
    ...common,
    mutationFn: (v: MemoDeleteVars): Promise<SyncResult> =>
      deleteMemo(v.id, versionToCompare(v.id, v.version)),
    onMutate: async (v: MemoDeleteVars) => {
      const ctx = await snapshot(v.tripId, v.id);
      setMemos(v.tripId, (memos) => memos.filter((m) => m.id !== v.id));
      return ctx;
    },
    onSuccess: (result: SyncResult) => {
      if (result.overwrote) notifySync(DELETED_EDITED_TEXT);
    },
    onError: (error, v: MemoDeleteVars, ctx: { before?: Memo } | undefined) => {
      const before = ctx?.before;
      if (isNetworkError(error) || !before) return;
      setMemos(v.tripId, (memos) => [...memos, before]);
    },
    onSettled: (_d, error, v: MemoDeleteVars) => settle(error, v.tripId),
  });
}

/** 화면에 먼저 보일 새 메모 — 서버가 채울 칸(작성자 · 때)은 누른 쪽 값으로 */
function optimisticMemo(v: MemoCreateVars): Memo {
  return {
    id: v.id,
    trip_id: v.tripId,
    schedule_item_id: v.itemId,
    author_id: v.authorId,
    body: v.body,
    starred: v.starred,
    pinned_by: v.pinnedBy,
    links: v.links,
    created_at: v.createdAt,
    updated_at: v.createdAt,
  };
}
