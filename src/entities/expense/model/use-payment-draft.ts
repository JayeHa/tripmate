"use client";

import { useState } from "react";

import { removeReceiptFiles } from "../api/receipts";
import type { PaymentOwnerKind } from "../lib/payment-owner";
import type { ExpenseDraft } from "./schema";
import { useCreateExpense } from "./use-expenses";

/**
 * 새 숙소 · 항공편 폼의 결제 초안 — 숙소 · 항공편이 아직 없어 비용을 붙일 곳이 없으니, 비용 입력의 값을 들고 있다가
 * 저장한 뒤 그 숙소 · 항공편의 결제로 만든다(save). 결제만 실패하면 숙소 · 항공편은 이미 저장됐으므로 되돌리지 않고 실패를 알린다 —
 * 초안의 영수증 파일은 붙을 곳이 없어지므로 지운다. 저장하지 않고 닫은 초안의 파일은 붙지 않은 파일 정리(#155)가 지운다.
 * userId 는 결제를 만든 사람(세션은 다른 도메인이라 부르는 쪽이 넘긴다). 없으면 저장이 실패한다
 */
export function usePaymentDraft(
  tripId: string,
  kind: PaymentOwnerKind,
  userId: string | undefined,
) {
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const create = useCreateExpense(tripId);

  /** 저장한 숙소 · 항공편에 초안을 결제로 만든다. 초안이 없거나 만들었으면 true, 실패하면 false */
  async function save(ownerId: string): Promise<boolean> {
    if (!draft) return true;
    try {
      if (!userId) throw new Error("no user");
      await create.mutateAsync({
        values: draft.values,
        createdBy: userId,
        receipts: draft.receipts,
        owner: { kind, id: ownerId },
      });
      return true;
    } catch {
      void removeReceiptFiles(
        tripId,
        draft.receipts.map((r) => r.key),
      );
      return false;
    }
  }

  return {
    draft,
    setDraft,
    save,
    saving: create.isPending,
    // 폼의 locked 와 같은 기준 — 오프라인으로 멈춘 동안은 창을 닫을 수 있게
    locked: create.isPending && !create.isPaused,
  };
}

export type PaymentDraftState = ReturnType<typeof usePaymentDraft>;
