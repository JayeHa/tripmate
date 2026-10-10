"use client";

import { useState } from "react";

import { linkedCardCount, useDeleteStay } from "@/entities/stay";

type StayDeleteOptions = {
  tripId: string;
  stayId: string;
  items: readonly { stay_id: string | null; alternative_of: string | null; day_index: number }[];
  /** 지웠다 — 폼은 부른 쪽이 닫는다. removed = 함께 지운 연결 카드 수 */
  onDeleted: (removed: number) => void;
};

/**
 * 「숙소 삭제」 — 연결 카드가 있으면 「연결된 일정 카드 N개도 지울까요?」(남기기 / 지우기), 없으면 「숙소를 삭제할까요?」.
 * 남기면 카드는 일반 장소 카드가 된다
 */
export function useStayDelete({ tripId, stayId, items, onDeleted }: StayDeleteOptions) {
  const [open, setOpen] = useState(false);
  const remove = useDeleteStay(tripId);
  return {
    open,
    count: linkedCardCount(items, stayId),
    request: () => setOpen(true),
    cancel: () => setOpen(false),
    /** deleteCards — 「지우기」 true · 「남기기」 false */
    confirm: (deleteCards: boolean) => {
      setOpen(false);
      remove.mutate({ stayId, deleteCards }, { onSuccess: onDeleted });
    },
    deleting: remove.isPending,
    error: remove.error?.message ?? null,
  };
}

export type StayDeleteState = ReturnType<typeof useStayDelete>;
