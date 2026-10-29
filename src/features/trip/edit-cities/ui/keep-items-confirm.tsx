"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { type KeptItems, keptItemsLabel } from "../lib/removed";

type KeepItemsConfirmProps = {
  kept: KeptItems | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/** 일정이 있는 도시를 뺄 때 — 일정은 지우지 않고 남는다는 확인 */
export function KeepItemsConfirm({ kept, onCancel, onConfirm }: KeepItemsConfirmProps) {
  return (
    <AlertDialog open={Boolean(kept)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        {kept && (
          <>
            <AlertDialogTitle>도시를 뺄까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {keptItemsLabel(kept)}. 일정 추가의 도시 칩에서만 빠져요.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <Button variant="chip" onClick={onCancel}>
                취소
              </Button>
              <Button onClick={onConfirm}>빼고 저장</Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
