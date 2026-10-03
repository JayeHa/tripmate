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
  onCancel: () => void;
  onConfirm: (trip: Trip) => void;
};

export function DeleteTripDialog({ trip, pending, onCancel, onConfirm }: Props) {
  return (
    <AlertDialog open={Boolean(trip)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="rounded-sheet px-[22px] pt-6 pb-5">
        {trip && (
          <>
            <AlertDialogTitle className="text-lg font-extrabold text-ink-900">
              {trip.title}을(를) 삭제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-[1.5] text-ink-500">
              일정, 메모, 가계부 기록이 함께 지워지고 되돌릴 수 없어요.
            </AlertDialogDescription>
            <div className="mt-3.5 flex gap-2">
              <Button variant="outline" size="form" className="flex-1" onClick={onCancel}>
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
