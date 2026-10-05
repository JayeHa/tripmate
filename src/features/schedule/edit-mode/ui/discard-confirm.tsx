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

type DiscardConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

/** 바꾼 게 있는데 뒤로 · 취소를 눌렀을 때 — 버릴지 묻는다 */
export function DiscardConfirm({ open, onOpenChange, onDiscard }: DiscardConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>편집한 내용을 버릴까요?</AlertDialogTitle>
          <AlertDialogDescription>「완료」를 누르지 않으면 저장되지 않아요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>계속 편집</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDiscard}>
            버리기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
