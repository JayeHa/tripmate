"use client";

import { Trash2 } from "lucide-react";
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

type DeleteChecklistButtonProps = { disabled: boolean; onConfirm: () => void };

/**
 * 편집 창 왼쪽 아래 휴지통(48 · 연한 빨강) — 한 번 더 묻고 지운다. 일행이 넣은 항목일 수 있고 되돌릴 수 없어서
 * 시안(바로 삭제)과 달리 확인창을 거친다
 */
export function DeleteChecklistButton({ disabled, onConfirm }: DeleteChecklistButtonProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="항목 삭제"
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className="flex h-11 w-12 shrink-0 items-center justify-center rounded-button bg-destructive-soft text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-4.5" aria-hidden="true" />
      </button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 항목을 삭제할까요?</AlertDialogTitle>
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
