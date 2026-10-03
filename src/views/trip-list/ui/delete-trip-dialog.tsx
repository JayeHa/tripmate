"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import type { Trip } from "@/entities/trip";

type Props = {
  trip: Trip | null;
  pending: boolean;
  /** 요청이 서버에 가 있는 동안은 닫지 못하게 한다. 오프라인 대기 중이면 false. */
  locked: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (trip: Trip) => void;
};

export function DeleteTripDialog({ trip, pending, locked, error, onCancel, onConfirm }: Props) {
  return (
    // 삭제 중에는 닫지 않는다. 닫히면 실패해도 알 수 없다.
    <AlertDialog open={Boolean(trip)} onOpenChange={(open) => !open && !locked && onCancel()}>
      <AlertDialogContent className="rounded-sheet px-[22px] pt-6 pb-5">
        {trip && (
          <>
            <AlertDialogTitle className="text-lg font-extrabold text-ink-900">
              {trip.title}을(를) 삭제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-[1.5] text-ink-500">
              일정, 메모, 가계부 기록이 함께 지워지고 되돌릴 수 없어요.
            </AlertDialogDescription>
            {error && <p className="text-sm text-destructive">삭제하지 못했어요: {error}</p>}
            <div className="mt-3.5 flex gap-2">
              <Button
                variant="outline"
                size="form"
                className="flex-1"
                disabled={locked}
                onClick={onCancel}
              >
                취소
              </Button>
              <Button
                size="form"
                className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                disabled={pending}
                onClick={() => onConfirm(trip)}
              >
                {pending ? "삭제 중…" : "삭제"}
              </Button>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
