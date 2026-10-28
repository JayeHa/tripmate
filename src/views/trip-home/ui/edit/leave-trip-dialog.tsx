"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

type LeaveTripDialogProps = {
  open: boolean;
  pending: boolean;
  /** 요청이 서버에 가 있는 동안은 닫지 못한다. 오프라인 대기 중이면 false */
  locked: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** 여행 나가기 확인 — 멤버만 연다. 일행의 기록은 그대로 남는다 */
export function LeaveTripDialog({
  open,
  pending,
  locked,
  error,
  onCancel,
  onConfirm,
}: LeaveTripDialogProps) {
  return (
    <AlertDialog open={open} locked={locked} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogTitle>여행에서 나갈까요?</AlertDialogTitle>
        <AlertDialogDescription>
          내 목록에서 이 여행이 사라져요. 일행의 일정·가계부·노트는 그대로 남아요.
        </AlertDialogDescription>
        {error && <p className="text-sm text-destructive">나가지 못했어요: {error}</p>}
        <AlertDialogFooter>
          <Button variant="chip" disabled={locked} onClick={onCancel}>
            취소
          </Button>
          <Button variant="danger" disabled={pending} onClick={onConfirm}>
            {pending ? "나가는 중…" : "나가기"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
