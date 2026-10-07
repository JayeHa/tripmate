import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

type DeleteExpenseConfirmProps = {
  onDelete: () => void;
  /** 누르는 버튼의 모양 — 수정 화면 머리의 빨강 칩 · 상세 화면 아래 회색 버튼 */
  className: string;
  disabled?: boolean;
  children: ReactNode;
};

/** 지출 「삭제」 버튼 — 누르면 확인 창을 띄우고, 확인하면 onDelete */
export function DeleteExpenseConfirm({
  onDelete,
  className,
  disabled,
  children,
}: DeleteExpenseConfirmProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={className} disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 지출을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>정산 내역에서도 제거돼요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onDelete}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
