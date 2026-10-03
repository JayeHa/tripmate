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
              일정 {move.count}개를 옮길게요
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm/normal text-ink-500">
              {daysLabel(move)}에 있던 일정을 마지막 날(day {move.lastDay}) 끝으로 옮겨요.
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

function daysLabel(move: PendingMove) {
  if (move.fromDay === move.toDay) return `day ${move.fromDay}`;
  return `day ${move.fromDay}~${move.toDay}`;
}
