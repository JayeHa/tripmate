"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { CreateExpense, EditExpense } from "./expense-editors";

/**
 * 연 비용 창 — 새로 추가(일정 상세에서 열면 그 일정에 연결), 또는 그 비용 수정.
 * quick: 일정 상세에서 열었다 — 빠른 입력(일정 연결 · 카테고리 · 날짜 칸을 숨기고 요약)
 */
export type ExpenseDialogTarget = { quick?: boolean } & (
  { kind: "new"; itemId?: string } | { kind: "edit"; expenseId: string }
);

type ExpenseDialogProps = {
  tripId: string;
  target: ExpenseDialogTarget | null;
  onClose: () => void;
};

/**
 * 비용 입력 창 — 모바일은 전체 화면, PC 는 가운데 440×760(화면이 낮으면 화면 높이까지). 안은 비용 입력 화면을 그대로 쓴다.
 * PC 가계부(「+ 비용 추가」 · 「수정」)와 일정 상세(「+ 비용」 · 비용 줄)가 함께 쓴다.
 * 바깥 · Esc · 폼의 ✕ 로 닫고, 저장 · 삭제하면 닫힌다. 목록은 저장이 다시 읽기를 부르므로 따로 갱신하지 않는다.
 * 저장 · 삭제 중에는 닫히지 않는다 — 닫으면 폼이 사라져 실패를 보일 곳이 없다
 */
export function ExpenseDialog({ tripId, target, onClose }: ExpenseDialogProps) {
  const [locked, setLocked] = useState(false);
  // 닫히는 동안(페이드 아웃)에도 내용을 그리도록 마지막으로 연 대상을 붙잡아 둔다 — 비우면 빈 흰 상자가 잠깐 남는다.
  // 렌더 중에 이전 값에서 조정한다(이펙트를 거치면 한 프레임 비어 보인다)
  // 열 때마다 폼을 새로 그린다 — 붙잡아 둔 내용 때문에 닫았다 다시 연 「비용 추가」 가 지난 입력을 이어받지 않게
  const [shown, setShown] = useState(target);
  const [opened, setOpened] = useState(0);
  if (target !== null && target !== shown) {
    setShown(target);
    setOpened((n) => n + 1);
  }
  /** 요청 중이 아니면 닫는다 */
  const close = () => {
    if (!locked) onClose();
  };
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none lg:h-[min(760px,calc(100dvh-2rem))] lg:w-110 lg:rounded-sheet"
      >
        <DialogTitle className="sr-only">
          {shown?.kind === "edit" ? "비용 수정" : "비용 추가"}
        </DialogTitle>
        {shown?.kind === "new" && (
          <CreateExpense
            key={opened}
            tripId={tripId}
            itemId={shown.itemId}
            quick={shown.quick}
            layout="modal"
            onClose={close}
            onDone={onClose}
            onLockChange={setLocked}
          />
        )}
        {shown?.kind === "edit" && (
          <EditExpense
            key={`${opened}-${shown.expenseId}`}
            tripId={tripId}
            expenseId={shown.expenseId}
            quick={shown.quick}
            layout="modal"
            onClose={close}
            onDone={onClose}
            onLockChange={setLocked}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
