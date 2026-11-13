"use client";

import { useSetVoucherUsed, type Voucher } from "@/entities/voucher";
import { saveErrorText } from "@/shared/api/sync";

/** 사용 표시를 바꾸지 못했을 때 */
const CHANGE_FAILED = "바꾸지 못했어요. 잠시 후 다시 시도해 주세요.";

/**
 * 「사용했어요」 토글 — 바우처 상세와 뷰어가 같은 값을 이것으로 바꾼다(일행 누구나). 화면이 먼저 바뀌어 다른 쪽에도 바로 보이고,
 * 저장된 뒤 토스트로 알린다. 되돌리기는 같은 버튼을 한 번 더 누르는 것이라 확인을 묻지 않는다.
 * 대기열 밖 저장이라 오프라인이면 막히고 화면이 되돌아간다
 */
export function useVoucherUsedToggle(tripId: string, onToast: (text: string) => void) {
  const used = useSetVoucherUsed(tripId);
  return (voucher: Pick<Voucher, "id" | "used_at">) => {
    const next = voucher.used_at ? null : new Date().toISOString();
    void used
      .mutateAsync({ id: voucher.id, value: next })
      .then(() => onToast(next ? "사용했어요로 표시했어요" : "사용 전으로 되돌렸어요"))
      .catch((e: unknown) => onToast(saveErrorText(e, CHANGE_FAILED)));
  };
}
