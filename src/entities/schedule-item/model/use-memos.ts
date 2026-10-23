"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import type { SyncResult } from "@/shared/api/sync";

import { fetchMemos } from "../api/memos";
import {
  MEMO_CREATE_KEY,
  MEMO_DELETE_KEY,
  MEMO_UPDATE_KEY,
  type MemoCreateVars,
  type MemoDeleteVars,
  type MemoUpdateVars,
} from "./memo-sync";

/** 여행의 메모 전부 — 타임라인 · 일정 상세가 일정마다 골라 쓴다 */
export function useMemos(tripId: string) {
  return useQuery({ queryKey: queryKeys.memos(tripId), queryFn: () => fetchMemos(tripId) });
}

/** 메모 쓰기 — 오프라인 대기열(함수 · 동작은 registerMemoSync 가 키로 등록해 둔다). id 는 부르는 쪽이 만든다 */
export function useCreateMemo() {
  return useMutation<void, Error, MemoCreateVars>({ mutationKey: MEMO_CREATE_KEY });
}

/** 메모 고치기 — 오프라인 대기열. version 은 열 때 본 메모의 updated_at */
export function useUpdateMemo() {
  return useMutation<SyncResult, Error, MemoUpdateVars>({ mutationKey: MEMO_UPDATE_KEY });
}

/** 메모 지우기 — 오프라인 대기열 */
export function useDeleteMemo() {
  return useMutation<SyncResult, Error, MemoDeleteVars>({ mutationKey: MEMO_DELETE_KEY });
}
