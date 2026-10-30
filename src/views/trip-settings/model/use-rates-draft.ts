"use client";

import { useState } from "react";

import { useExpenses } from "@/entities/expense";
import { type Trip, useSaveTripRates } from "@/entities/trip";

import {
  checkRates,
  hasChanges,
  initialDrafts,
  newDraft,
  type RateDraft,
  removedInUse,
} from "../lib/rate-draft";

let nextId = 0;
/** 줄 key — 창을 여러 번 열어도 겹치지 않게 모듈에서 센다 */
const makeId = () => `rate-${nextId++}`;

/**
 * 환율 창의 입력 — 열 때 지금 여행 환율(여행지 통화가 비어 있으면 대략 값을 채운 줄, #251)에서 시작한다.
 * 저장은 바뀐 통화만 보낸다. 뺄 통화를 지출이 쓰고 있으면 그 건수를 알린다(합계에서 빠진다)
 */
export function useRatesDraft(trip: Trip, destination: string | null, onSaved: () => void) {
  const [drafts, setDrafts] = useState(() =>
    initialDrafts(trip.exchange_rates, trip.home_currency, destination, makeId),
  );
  const { data: expenses = [] } = useExpenses(trip.id);
  const save = useSaveTripRates(trip.id);
  const check = checkRates(trip.exchange_rates, drafts);

  /** 한 줄의 칸 하나를 바꾼다 */
  function edit(id: string, patch: Partial<Omit<RateDraft, "id">>) {
    setDrafts((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return {
    drafts,
    edit,
    add: () => {
      const row = newDraft(drafts, trip.home_currency, makeId);
      if (row) setDrafts((rows) => [...rows, row]);
    },
    remove: (id: string) => setDrafts((rows) => rows.filter((r) => r.id !== id)),
    error: check.error,
    inUse: removedInUse(check.changes.remove, expenses),
    canSave: check.error === null && hasChanges(check.changes) && !save.isPending,
    pending: save.isPending,
    saveError: save.error?.message ?? null,
    submit: () => {
      if (check.error !== null || !hasChanges(check.changes)) return;
      save.mutate({ home: trip.home_currency, changes: check.changes }, { onSuccess: onSaved });
    },
  };
}

export type RatesDraftState = ReturnType<typeof useRatesDraft>;
