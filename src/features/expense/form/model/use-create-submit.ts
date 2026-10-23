"use client";

import { onlineManager } from "@tanstack/react-query";
import { useState } from "react";

import {
  type ExpenseFormValues,
  type PaymentOwner,
  type ReceiptChange,
  useCreateExpense,
  useQueueExpense,
} from "@/entities/expense";

/**
 * 비용 추가의 저장 — 영수증 없는 보통 비용은 오프라인 대기열로(목록에 먼저 들어간다), 영수증이 있거나
 * 숙소 · 항공편 결제면 온라인에서만(파일 · 트리거가 얽혀 중간에 끊기면 안 된다).
 * 온라인이면 끝날 때까지 기다려 오류를 폼에 보이고, 오프라인이면 대기열에 남았으니 바로 닫는다.
 * 대기열에 넣는 비용의 id 는 창 하나에 하나 — 서버에 닿지 못해 실패한 뒤 「완료」 를 다시 눌러도 같은 비용이 두 개 생기지 않게
 * (창은 열 때마다 새로 마운트된다)
 */
export function useCreateSubmit(tripId: string, onDone: () => void) {
  const create = useCreateExpense(tripId);
  const queue = useQueueExpense();
  const [id] = useState(() => crypto.randomUUID());
  return {
    pending: create.isPending || queue.isPending,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: [create, queue].some((m) => m.isPending && !m.isPaused),
    error: create.error?.message ?? queue.error?.message,
    submit(
      values: ExpenseFormValues,
      receipts: ReceiptChange,
      createdBy: string,
      owner: PaymentOwner | null,
    ) {
      if (receipts.attach.length > 0 || owner) {
        create.mutate(
          { values, createdBy, receipts: receipts.attach, owner },
          { onSuccess: onDone },
        );
        return;
      }
      queue.mutate(
        { tripId, id, values, createdBy, createdAt: new Date().toISOString() },
        { onSuccess: onDone },
      );
      if (!onlineManager.isOnline()) onDone();
    },
  };
}
