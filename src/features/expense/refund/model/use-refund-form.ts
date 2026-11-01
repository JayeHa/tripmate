"use client";

import { useState } from "react";

import { type TaxRefund, useDeleteTaxRefund, useSaveTaxRefund } from "@/entities/tax-refund";
import { saveErrorText } from "@/shared/api/sync";
import { todayISO } from "@/shared/lib/days";

import { canSaveDraft, draftOf, fieldsOf, type RefundDraft } from "../lib/refund-form";

/**
 * 택스 리펀 한 건 편집 상태 — 칸 값 · 저장 · 삭제.
 * 저장이 끝나면 닫고(새 건은 「기록했어요」 토스트), 실패하면 창에 남아 오류를 보인다
 */
export function useRefundForm(
  tripId: string,
  refund: TaxRefund | null,
  startCurrency: string,
  onClose: () => void,
  onToast: (text: string) => void,
) {
  const [draft, setDraft] = useState<RefundDraft>(() => draftOf(refund, startCurrency, todayISO()));
  const save = useSaveTaxRefund(tripId);
  const remove = useDeleteTaxRefund(tripId);
  const pending = save.isPending || remove.isPending;
  const failed = save.error ?? remove.error;

  /** 칸 하나 바꾸기 */
  const set = <K extends keyof RefundDraft>(key: K, value: RefundDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /** 저장하고 닫는다 */
  function submit() {
    save.mutate(
      { id: refund?.id ?? null, fields: fieldsOf(draft) },
      {
        onSuccess: () => {
          onClose();
          if (!refund) onToast("환급 기록을 추가했어요");
        },
      },
    );
  }

  /** 지우고 닫는다 */
  function destroy() {
    if (refund) remove.mutate(refund.id, { onSuccess: onClose });
  }

  return {
    draft,
    set,
    canSave: canSaveDraft(draft),
    canDelete: refund !== null,
    pending,
    error: failed ? saveErrorText(failed, "저장하지 못했어요. 잠시 뒤 다시 해 주세요") : null,
    submit,
    destroy,
  };
}

export type RefundFormState = ReturnType<typeof useRefundForm>;
