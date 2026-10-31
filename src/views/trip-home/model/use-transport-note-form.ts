"use client";

import { useState } from "react";

import { useSaveTransportNote } from "@/entities/transport-fare";
import { saveErrorText } from "@/shared/api/sync";

/** 교통카드 · 패스 메모 500자(0072) */
export const TRANSPORT_NOTE_MAX = 500;

/** 교통카드 · 패스 메모 편집 — 저장되면 닫고, 실패하면 창에 남아 오류를 보인다. 비우고 저장하면 메모를 지운다 */
export function useTransportNoteForm(tripId: string, initial: string | null, onClose: () => void) {
  const [text, setText] = useState(initial ?? "");
  const save = useSaveTransportNote(tripId);
  return {
    text,
    setText,
    pending: save.isPending,
    error: save.error
      ? saveErrorText(save.error, "저장하지 못했어요. 잠시 뒤 다시 해 주세요")
      : null,
    submit: () => save.mutate(text, { onSuccess: onClose }),
  };
}
