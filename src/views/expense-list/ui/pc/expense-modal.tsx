"use client";

import { useState } from "react";

import { CreateExpense, EditExpense } from "@/features/expense/form";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

/** PC 가계부에서 연 비용 창 — 새로 추가, 또는 그 비용 수정 */
export type ExpenseModalTarget = { kind: "new" } | { kind: "edit"; expenseId: string };

type ExpenseModalProps = {
  tripId: string;
  target: ExpenseModalTarget | null;
  onClose: () => void;
};

/**
 * PC 비용 입력 창 — 가운데 440×760(화면이 낮으면 화면 높이까지), 안은 비용 입력 화면을 그대로 쓴다(모바일과 같은 폼).
 * 바깥 · Esc · 폼의 ✕ 로 닫고, 저장 · 삭제하면 닫힌다. 목록은 저장이 다시 읽기를 부르므로 따로 갱신하지 않는다.
 * 저장 · 삭제 중에는 닫히지 않는다 — 닫으면 폼이 사라져 실패를 보일 곳이 없다
 */
export function ExpenseModal({ tripId, target, onClose }: ExpenseModalProps) {
  const [busy, setBusy] = useState(false);
  /** 요청 중이 아니면 닫는다 */
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(760px,calc(100dvh-2rem))] w-110 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-110"
      >
        <DialogTitle className="sr-only">
          {target?.kind === "edit" ? "비용 수정" : "비용 추가"}
        </DialogTitle>
        {target?.kind === "new" && (
          <CreateExpense
            tripId={tripId}
            layout="modal"
            onClose={close}
            onDone={onClose}
            onBusyChange={setBusy}
          />
        )}
        {target?.kind === "edit" && (
          <EditExpense
            key={target.expenseId}
            tripId={tripId}
            expenseId={target.expenseId}
            layout="modal"
            onClose={close}
            onDone={onClose}
            onBusyChange={setBusy}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
