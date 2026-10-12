"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { fetchPaymentReceiptKeys, removeReceiptFiles, useExpenses } from "@/entities/expense";
import { deleteStay, linkedCardCount, useInvalidateStays } from "@/entities/stay";

type StayDeleteOptions = {
  tripId: string;
  stayId: string;
  items: readonly { stay_id: string | null; alternative_of: string | null; day_index: number }[];
  /** 지웠다 — 폼은 부른 쪽이 닫는다. removed = 함께 지운 연결 카드 수 */
  onDeleted: (removed: number) => void;
};

/**
 * 숙소를 지운다. 결제 비용과 그 영수증 줄은 DB 가 함께 지우지만(cascade) 저장소의 파일은 모르므로,
 * 지우기 전에 영수증 키를 읽어 두고 지운 뒤 파일을 지운다(일반 비용 삭제와 같은 순서)
 */
async function deleteStayWithReceipts(
  tripId: string,
  stayId: string,
  deleteCards: boolean,
): Promise<number> {
  const keys = await fetchPaymentReceiptKeys({ kind: "stay", id: stayId });
  const removed = await deleteStay(stayId, deleteCards);
  await removeReceiptFiles(tripId, keys);
  return removed;
}

/**
 * 「숙소 삭제」 — 연결 카드가 있으면 「연결된 일정 카드 N개도 지울까요?」(남기기 / 지우기), 없으면 「숙소를 삭제할까요?」.
 * 남기면 카드는 일반 장소 카드가 된다. 결제가 있으면 확인창에 가계부 기록도 함께 지워진다고 알린다
 */
export function useStayDelete({ tripId, stayId, items, onDeleted }: StayDeleteOptions) {
  const [open, setOpen] = useState(false);
  const { data: expenses } = useExpenses(tripId);
  const invalidate = useInvalidateStays(tripId);
  const remove = useMutation({
    mutationFn: (deleteCards: boolean) => deleteStayWithReceipts(tripId, stayId, deleteCards),
    onSuccess: invalidate,
  });
  return {
    open,
    count: linkedCardCount(items, stayId),
    paid: expenses?.some((e) => e.stay_id === stayId) ?? false,
    request: () => setOpen(true),
    cancel: () => setOpen(false),
    /** deleteCards — 「지우기」 true · 「남기기」 false */
    confirm: (deleteCards: boolean) => {
      setOpen(false);
      remove.mutate(deleteCards, { onSuccess: onDeleted });
    },
    deleting: remove.isPending,
    error: remove.error?.message ?? null,
  };
}

export type StayDeleteState = ReturnType<typeof useStayDelete>;
