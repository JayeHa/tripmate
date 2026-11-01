"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

type DeleteRefundButtonProps = { disabled: boolean; onConfirm: () => void };

/** 환급 폼 왼쪽 아래 「삭제」 — 한 번 더 묻고 지운다(일행이 쓴 기록일 수 있다) */
export function DeleteRefundButton({ disabled, onConfirm }: DeleteRefundButtonProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className="h-11 px-1 text-sm font-bold text-destructive disabled:opacity-40"
      >
        삭제
      </button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 환급 기록을 지울까요?</AlertDialogTitle>
            <AlertDialogDescription>
              일행 모두에게서 지워지고 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={onConfirm}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
