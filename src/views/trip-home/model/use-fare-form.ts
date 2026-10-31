"use client";

import { useState } from "react";

import { type TransportFare, useDeleteFare, useSaveFare } from "@/entities/transport-fare";

import { amountDraft, parseAmount } from "../lib/transport";

/** 고치는 줄 — 그날 줄(없으면 새로) · 날짜 밖 줄(없으면 새로) */
export type FareTarget =
  | { kind: "day"; dayIndex: number; fare: TransportFare | null }
  | { kind: "extra"; fare: TransportFare | null };

/** 이름 30자 · 메모 200자(0072) */
export const FARE_TITLE_MAX = 30;
export const FARE_MEMO_MAX = 200;

/**
 * 교통비 한 줄 편집 상태 — 이름(날짜 밖 줄만) · 금액 글자 · 통화 · 메모.
 * 저장이 끝나면 닫고, 실패하면 창에 남아 오류를 보인다. 날짜 줄은 금액 · 메모를 다 비우고 저장하면 지운다
 */
export function useFareForm(
  tripId: string,
  target: FareTarget,
  startCurrency: string,
  onClose: () => void,
) {
  const { fare } = target;
  const [title, setTitle] = useState(fare?.title ?? "");
  const [amount, setAmount] = useState(amountDraft(fare?.amount ?? null));
  const [currency, setCurrency] = useState(fare?.currency ?? startCurrency);
  const [memo, setMemo] = useState(fare?.memo ?? "");
  const save = useSaveFare(tripId);
  const remove = useDeleteFare(tripId);
  const pending = save.isPending || remove.isPending;
  const failed = save.error ?? remove.error;
  const draft = { amount: parseAmount(amount, currency), currency, memo };

  /** 저장하고 닫는다 */
  function submit() {
    const vars =
      target.kind === "day"
        ? { kind: "day" as const, dayIndex: target.dayIndex, draft }
        : { kind: "extra" as const, id: fare?.id ?? null, title, draft };
    save.mutate(vars, { onSuccess: onClose });
  }

  /** 날짜 밖 줄을 지우고 닫는다 */
  function destroy() {
    if (fare) remove.mutate(fare.id, { onSuccess: onClose });
  }

  return {
    title,
    setTitle,
    amount,
    setAmount,
    currency,
    setCurrency,
    memo,
    setMemo,
    canSave: target.kind === "day" || title.trim().length > 0,
    canDelete: target.kind === "extra" && fare !== null,
    pending,
    error: failed ? "저장하지 못했어요. 잠시 뒤 다시 해 주세요" : null,
    submit,
    destroy,
  };
}
