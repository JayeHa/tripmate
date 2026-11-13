"use client";

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchVisitNotes } from "../api/visit-notes";
import { cleanNoteBody, notesByItem, type VisitNotesByItem } from "./visit-note";
import { VISIT_NOTE_KEY, type VisitNoteVars } from "./visit-note-sync";

/** 기록 글의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const visitNotesQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.visitNotes(tripId), queryFn: () => fetchVisitNotes(tripId) });

/**
 * 그 여행의 기록 글(일정마다 하나, 일행이 함께 쓴다)과 바꾸기. 바꾸기는 오프라인 대기열로 올라가고 화면은 먼저 바뀐다.
 * 나를 모르는 동안(로그인 확인 전)은 바꾸지 않는다. 빈 글은 지우기.
 * 글이 바뀌었는지는 부르는 쪽이 고치기 시작할 때 본 글로 가린다 — 여기서 지금 글과 비교하면
 * 창을 연 동안 일행이 고친 글을, 손대지 않은 내 저장이 옛 글로 되돌린다
 */
export function useVisitNotes(tripId: string, userId: string | null) {
  const { data } = useQuery(visitNotesQuery(tripId));
  const byItem: VisitNotesByItem = useMemo(() => notesByItem(data ?? []), [data]);
  const { mutate } = useMutation<boolean, Error, VisitNoteVars>({ mutationKey: VISIT_NOTE_KEY });
  /** 일정 하나의 기록 글을 바꾼다. 비우면 지운다. seen = 고치기 시작할 때 본 글의 updated_at(없었으면 null) */
  function save(itemId: string, text: string, seen: string | null) {
    if (!userId) return;
    mutate({
      tripId,
      itemId,
      body: cleanNoteBody(text),
      userId,
      at: new Date().toISOString(),
      seen,
    });
  }
  return [byItem, save] as const;
}
