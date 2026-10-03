"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { PendingMove } from "../model/use-edit-dates";

type MoveItemsConfirmProps = {
  move: PendingMove | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** 기간을 줄여 사라지는 날의 일정을 마지막 날로 옮긴다는 확인 */
export function MoveItemsConfirm({ move, onCancel, onConfirm }: MoveItemsConfirmProps) {
  return (
    <AlertDialog open={Boolean(move)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="rounded-sheet px-5.5 pt-6 pb-5">
        {move && (
          <>
            <AlertDialogTitle className="text-lg font-extrabold text-ink-900">
              {countLabel(move)}를 옮길게요
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm/normal text-ink-500">
              {daysLabel(move)}에 있던 {kindsLabel(move)} 마지막 날(day {move.lastDay})로 옮겨요.
            </AlertDialogDescription>
            <div className="mt-3.5 flex gap-2">
              <Button variant="outline" size="form" className="flex-1" onClick={onCancel}>
                취소
              </Button>
              <Button size="form" className="flex-1" onClick={onConfirm}>
                옮기고 수정
              </Button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 「일정 3개 · 지출 2개」 — 0개인 쪽은 뺀다 */
function countLabel(move: PendingMove) {
  const parts = [
    move.items > 0 && `일정 ${move.items}개`,
    move.expenses > 0 && `지출 ${move.expenses}개`,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** 「일정과 지출을」 · 「일정을」 · 「지출을」 */
function kindsLabel(move: PendingMove) {
  if (move.items > 0 && move.expenses > 0) return "일정과 지출을";
  return move.items > 0 ? "일정을" : "지출을";
}

function daysLabel(move: PendingMove) {
  if (move.fromDay === move.toDay) return `day ${move.fromDay}`;
  return `day ${move.fromDay}~${move.toDay}`;
}
