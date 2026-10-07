import type { PersonKey } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
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

import type { TransferRow } from "../../lib/dashboard";

type CancelTransferDialogProps = {
  /** 취소를 묻는 송금(이미 보냈다고 적은 줄). null 이면 닫힘 */
  row: TransferRow | null;
  home: string;
  nameOf: (key: PersonKey) => string;
  onClose: () => void;
  onConfirm: (row: TransferRow) => void;
};

/** 「송금 기록을 취소할까요?」 — 보냈다고 적은 기록을 지우면 그 금액이 남은 송금으로 돌아간다 */
export function CancelTransferDialog({
  row,
  home,
  nameOf,
  onClose,
  onConfirm,
}: CancelTransferDialogProps) {
  return (
    <AlertDialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>송금 기록을 취소할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {row &&
              `${nameOf(row.from)} → ${nameOf(row.to)} ${formatMoney(row.amount, home)}을 보내지 않은 것으로 되돌려요. 남은 송금에 다시 보여요.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>그대로 두기</AlertDialogCancel>
          <AlertDialogAction
            variant="danger"
            onClick={() => {
              if (row) onConfirm(row);
              onClose();
            }}
          >
            기록 취소
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
