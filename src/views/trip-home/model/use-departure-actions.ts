"use client";

import { stepPatch, type TaxRefund, useSetRefundSteps } from "@/entities/tax-refund";
import { saveErrorText } from "@/shared/api/sync";
import type { ToastMessage } from "@/shared/ui/toast";

import type { DepartureStep } from "../lib/departure-refunds";

/** 토스트 글 — 「AlpenTOKYO 세관 확인했어요」 · 「AlpenTOKYO 환급 받았어요」 */
const DONE_TEXT: Record<DepartureStep, string> = {
  customs: "세관 확인했어요",
  received: "환급 받았어요",
};

/**
 * 출국 날 카드의 단계 버튼 — 화면을 먼저 바꾸고 올린다(가계부 「환급」 상세와 같은 저장).
 * 「되돌리기」 는 누르기 전 두 칸으로 돌린다. 실패하면 화면이 되돌아가고 토스트로 알린다
 */
export function useDepartureActions(
  tripId: string,
  onToast: (message: Omit<ToastMessage, "id">) => void,
) {
  const steps = useSetRefundSteps(tripId);
  /** 실패 토스트 */
  const fail = (e: unknown) =>
    onToast({ text: saveErrorText(e, "바꾸지 못했어요. 잠시 뒤 다시 해 주세요") });
  return (refund: TaxRefund, step: DepartureStep) => {
    const before = { customs_at: refund.customs_at, received_at: refund.received_at };
    steps.mutate(
      { id: refund.id, steps: stepPatch(refund, step, new Date().toISOString()) },
      {
        onError: fail,
        onSuccess: () =>
          onToast({
            text: `${refund.store} ${DONE_TEXT[step]}`,
            action: {
              label: "되돌리기",
              onClick: () => steps.mutate({ id: refund.id, steps: before }, { onError: fail }),
            },
          }),
      },
    );
  };
}
