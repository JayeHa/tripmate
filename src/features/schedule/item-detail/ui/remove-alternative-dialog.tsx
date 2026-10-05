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
};

/** 자기 기록(예약 상태 · 메모 · 링크)이 있는 대체 장소를 빼기 전에 한 번 더 묻는다 */
export function RemoveAlternativeDialog({
  open,
  onOpenChange,
  onConfirm,
}: RemoveAlternativeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>대체 장소에서 뺄까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 장소에 적어 둔 예약 상태 · 메모 · 링크가 함께 지워져요.
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
