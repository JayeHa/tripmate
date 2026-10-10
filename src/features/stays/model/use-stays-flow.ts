"use client";

import { useState } from "react";

/** 숙소 창의 화면 — 목록 · 상세 · 입력(새로 / 고치기) */
export type StaysStep =
  { kind: "list" } | { kind: "detail"; id: string } | { kind: "form"; id: string | null };

/**
 * 숙소 창 안의 화면 전환. 뒤로는 고치기 폼 → 상세, 새 숙소 폼 → 목록, 상세 → 목록, 목록 → 닫기.
 * 처음 열 때 보일 숙소(initialId)가 있으면 상세부터
 */
export function useStaysFlow(initialId: string | null, onClose: () => void) {
  const [step, setStep] = useState<StaysStep>(
    initialId ? { kind: "detail", id: initialId } : { kind: "list" },
  );
  return {
    step,
    openDetail: (id: string) => setStep({ kind: "detail", id }),
    openForm: (id: string | null) => setStep({ kind: "form", id }),
    toList: () => setStep({ kind: "list" }),
    /** 뒤로 — 어디서 왔는지에 따라 */
    back: () => {
      if (step.kind === "list") onClose();
      else if (step.kind === "form" && step.id) setStep({ kind: "detail", id: step.id });
      else setStep({ kind: "list" });
    },
  };
}

export type StaysFlow = ReturnType<typeof useStaysFlow>;
