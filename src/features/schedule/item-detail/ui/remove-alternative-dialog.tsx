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

type RemoveAlternativeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** 이 대체 장소에 연결된 비용 수 — 있으면 비용이 어떻게 남는지 알린다 */
  expenseCount: number;
};

/**
 * 자기 기록(예약 상태 · 메모 · 링크 · 연결된 비용)이 있는 대체 장소를 빼기 전에 한 번 더 묻는다.
 * 연결된 비용은 지워지지 않고 연결만 끊긴다 — 대체 장소라 합계에서 빠져 있던 채로 남으니(0033) 그것도 알린다
 */
export function RemoveAlternativeDialog({
  open,
  onOpenChange,
  onConfirm,
  expenseCount,
}: RemoveAlternativeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>대체 장소에서 뺄까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 장소에 적어 둔 예약 상태 · 메모 · 링크가 함께 지워져요.
            {expenseCount > 0 &&
              ` 연결된 비용 ${expenseCount}건은 가계부에 남지만 합계에서 빠진 채로 남아요.`}
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
