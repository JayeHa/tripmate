"use client";

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchVisits } from "../api/visits";
import { clearLocalMarks, readLocalMarks } from "./local-visit-marks";
import { useScheduleItems } from "./use-schedule-items";
import { marksOf, type VisitMark, type VisitMarks } from "./visit";
import { VISIT_KEY, type VisitVars } from "./visit-sync";

/** 다녀감 표시의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const visitsQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.visits(tripId), queryFn: () => fetchVisits(tripId) });

const EMPTY: VisitMarks = {};

/** 이번 방문에서 예전 표시를 이미 올린 여행 — 이 훅을 쓰는 화면이 여럿이어도 한 번만 */
const moved = new Set<string>();

/**
 * 이 기기에 남은 예전 표시(tm-visit-marks)를 한 번 올리고 지운다. 표시 · 일정을 다 읽은 뒤에 —
 * 이미 표시가 있는 일정(일행이 눌렀다)은 덮지 않고, 지워진 일정은 올리지 않는다(실패로 남지 않게)
 */
function useMoveLocalMarks(
  tripId: string,
  enabled: boolean,
  marks: VisitMarks | undefined,
  save: (v: VisitVars) => void,
) {
  const items = useScheduleItems(tripId).data;
  useEffect(() => {
    if (!enabled || !marks || !items || moved.has(tripId)) return;
    moved.add(tripId);
    const local = readLocalMarks(tripId);
    const ids = new Set(items.map((i) => i.id));
    const at = new Date().toISOString();
    for (const [itemId, mark] of Object.entries(local)) {
      if (ids.has(itemId) && !marks[itemId]) save({ tripId, itemId, mark, at });
    }
    clearLocalMarks(tripId);
  }, [enabled, marks, items, tripId, save]);
}

/**
 * 그 여행의 다녀감 표시와 바꾸기 — 일행이 함께 쓴다(0083). 홈 「들렀어요」 · 일정 상세 「방문」 이 바꾸고,
 * 홈 「다음 장소」 · 일정의 회색이 읽는다. 바꾸기는 오프라인 대기열로 올라가고 화면은 먼저 바뀐다.
 * persist 가 false 면(여행 전에 「여행 중」 을 미리 볼 때) 올리지 않고 이 화면에서만 기억한다.
 * 읽기 전에는 빈 기록이다
 */
export function useVisitMarks(tripId: string, persist = true) {
  const { data } = useQuery(visitsQuery(tripId));
  const saved = useMemo(() => (data ? marksOf(data) : undefined), [data]);
  const { mutate } = useMutation<void, Error, VisitVars>({ mutationKey: VISIT_KEY });
  const [preview, setPreview] = useState<VisitMarks>(EMPTY);
  useMoveLocalMarks(tripId, persist, saved, mutate);
  const marks = persist ? (saved ?? EMPTY) : preview;
  /** 일정 하나의 표시를 바꾼다. null 이면 지운다 */
  function setMark(itemId: string, mark: VisitMark | null) {
    if (!persist) {
      setPreview((prev) => {
        const rest = Object.fromEntries(Object.entries(prev).filter(([id]) => id !== itemId));
        return mark ? { ...rest, [itemId]: mark } : rest;
      });
      return;
    }
    mutate({ tripId, itemId, mark, at: new Date().toISOString() });
  }
  return [marks, setMark] as const;
}
