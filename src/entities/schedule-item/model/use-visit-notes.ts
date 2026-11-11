"use client";

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchVisitNotes } from "../api/visit-notes";
import { cleanNoteBody, noteBodiesOf, type VisitNoteBodies } from "./visit-note";
import { VISIT_NOTE_KEY, type VisitNoteVars } from "./visit-note-sync";

/** 기록 글의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const visitNotesQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.visitNotes(tripId), queryFn: () => fetchVisitNotes(tripId) });

/**
 * 그 여행에서 내가 남긴 기록 글과 바꾸기. 바꾸기는 오프라인 대기열로 올라가고 화면은 먼저 바뀐다.
 * 나를 모르는 동안(로그인 확인 전)은 빈 값이고 바꾸지 않는다. 빈 글은 지우기, 같은 글이면 올리지 않는다
 */
export function useMyVisitNotes(tripId: string, userId: string | null) {
  const { data } = useQuery(visitNotesQuery(tripId));
  const bodies: VisitNoteBodies = useMemo(() => noteBodiesOf(data ?? [], userId), [data, userId]);
  const { mutate } = useMutation<void, Error, VisitNoteVars>({ mutationKey: VISIT_NOTE_KEY });
  /** 일정 하나의 내 기록 글을 바꾼다. 비우면 지운다 */
  function setBody(itemId: string, text: string) {
    const body = cleanNoteBody(text);
    if (!userId || body === (bodies[itemId] ?? "")) return;
    mutate({ tripId, itemId, body, userId, at: new Date().toISOString() });
  }
  return [bodies, setBody] as const;
}
