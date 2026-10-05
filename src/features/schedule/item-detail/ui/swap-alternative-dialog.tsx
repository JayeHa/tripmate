import type { ScheduleItem } from "@/entities/schedule-item";
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

import { swapQuestion } from "../lib/alternatives";

type SwapAlternativeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  main: ScheduleItem;
  alt: ScheduleItem;
  onConfirm: () => void;
};

/** 「바꾸기」 확인 — 「A」 대신 「B」로 바꿀까요? 시간 · 순서는 자리에, 예약 상태 · 메모는 각 장소에 남는다고 알린다 */
export function SwapAlternativeDialog({
  open,
  onOpenChange,
  main,
  alt,
  onConfirm,
}: SwapAlternativeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{swapQuestion(main, alt)}</AlertDialogTitle>
          <AlertDialogDescription>
            시간과 순서는 그대로예요. 예약 상태 · 메모는 각 장소에 남아요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>바꾸기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
