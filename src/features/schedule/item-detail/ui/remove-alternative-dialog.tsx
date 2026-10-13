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

import { linkedChecklistNote, linkedExpenseNote, type LinkedExpenses } from "../lib/alternatives";

type RemoveAlternativeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** 이 대체 장소에 연결된 비용 — 있으면 비용이 어떻게 남는지 알린다 */
  expenses: LinkedExpenses;
  /** 이 대체 장소에 직접 연결된 체크리스트 항목 수(완료 포함) — 있으면 연결만 풀린다고 알린다 */
  checklistCount: number;
};

/**
 * 자기 기록(예약 상태 · 메모 · 링크 · 연결된 비용 · 연결된 체크리스트)이 있는 대체 장소를 빼기 전에 한 번 더 묻는다.
 * 연결된 비용은 지워지지 않고 연결만 끊긴다 — 합계에서 빠져 있던 비용은 그대로 빠진 채로 남으니 그것도 알린다(linkedExpenseNote)
 */
export function RemoveAlternativeDialog({
  open,
  onOpenChange,
  onConfirm,
  expenses,
  checklistCount,
}: RemoveAlternativeDialogProps) {
  const checklistNote = linkedChecklistNote(checklistCount);
  const expenseNote = linkedExpenseNote(expenses);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>대체 장소에서 뺄까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 장소에 적어 둔 예약 상태 · 메모 · 링크가 함께 지워져요.
            {checklistNote && ` ${checklistNote}`}
            {expenseNote && ` ${expenseNote}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirm}>
            빼기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
