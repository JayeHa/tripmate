"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { Trip } from "../model/types";

type DeleteTripDialogProps = {
  trip: Trip | null;
  pending: boolean;
  /** 요청이 서버에 가 있는 동안은 닫지 못하게 한다. 오프라인 대기 중이면 false. */
  locked: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (trip: Trip) => void;
};

/** 여행 삭제 확인 창 — 방장만 연다(여행 목록 · 여행 홈 「편집」). 지우는 동안은 닫지 못하고, 실패하면 이유를 보인다 */
export function DeleteTripDialog({
  trip,
  pending,
  locked,
  error,
  onCancel,
  onConfirm,
}: DeleteTripDialogProps) {
  return (
    // 삭제 중에는 닫지 않는다. 닫히면 실패해도 알 수 없다.
    <AlertDialog open={Boolean(trip)} locked={locked} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        {trip && (
          <>
            <AlertDialogTitle>{trip.title}을(를) 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              일정, 메모, 가계부 기록이 함께 지워지고 되돌릴 수 없어요.
            </AlertDialogDescription>
            {error && <p className="text-sm text-destructive">삭제하지 못했어요: {error}</p>}
            <AlertDialogFooter>
              <Button variant="chip" disabled={locked} onClick={onCancel}>
                취소
              </Button>
              <Button variant="danger" disabled={pending} onClick={() => onConfirm(trip)}>
                {pending ? "삭제 중…" : "삭제"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
