"use client";

import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { GuideActions } from "../../model/use-guide-actions";

type GuideRemoveDialogProps = { remove: GuideActions["remove"]; name: string | null };

/** 보관함에서 빼기 확인 — 장소는 지우지 않고 이 여행 가이드에서만, 메모도 함께 */
export function GuideRemoveDialog({ remove, name }: GuideRemoveDialogProps) {
  const open = remove.placeId !== null;
  const shown = useHeldWhileClosing(open, name);
  return (
    <AlertDialog
      open={open}
      locked={remove.locked}
      onOpenChange={(next) => !next && remove.cancel()}
    >
      <AlertDialogContent>
        <AlertDialogTitle>「{shown}」을(를) 보관함에서 뺄까요?</AlertDialogTitle>
        <AlertDialogDescription>
          이 여행의 가이드에서만 빠지고 장소는 남아요. 이 여행 메모도 함께 지워져요.
        </AlertDialogDescription>
        {remove.error && <p className="text-sm text-destructive">빼지 못했어요: {remove.error}</p>}
        <AlertDialogFooter>
          <Button variant="chip" disabled={remove.locked} onClick={remove.cancel}>
            취소
          </Button>
          <Button variant="danger" disabled={remove.pending} onClick={remove.confirm}>
            {remove.pending ? "빼는 중…" : "빼기"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
