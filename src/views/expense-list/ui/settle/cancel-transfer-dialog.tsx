import type { PersonKey } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
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
import type { Dashboard } from "../../model/use-dashboard";
import { TransferLine } from "../dashboard/transfer-line";

type CancelTransferDialogProps = {
  /** 표시를 풀지 묻는 송금(이미 보냈다고 적은 줄). null 이면 닫힘 */
  row: TransferRow | null;
  home: string;
  /** 나 — 내가 받는 줄이면 「받았어요」, 아니면 「보냈어요」 */
  me: PersonKey | null;
  avatarOf: Dashboard["avatarOf"];
  onClose: () => void;
  onConfirm: (row: TransferRow) => void;
};

/**
 * 「보냈어요 표시를 풀까요?」(내가 받는 줄이면 「받았어요 …」) — 송금 줄(보내는 사람 → 받는 사람 · 금액)과
 * 「다시 남은 송금으로 돌아가요.」 표시를 풀면 송금 기록을 지워 그 금액이 남은 송금으로 돌아간다. 표시하는 쪽은 확인 없이 바로
 */
export function CancelTransferDialog({
  row,
  home,
  me,
  avatarOf,
  onClose,
  onConfirm,
}: CancelTransferDialogProps) {
  // 닫히는 동안(페이드 아웃)에도 내용을 그리도록 마지막으로 물은 줄을 붙잡아 둔다
  const shown = useHeldWhileClosing(row !== null, row);
  const verb = shown && shown.to === me ? "받았어요" : "보냈어요";
  return (
    <AlertDialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{verb} 표시를 풀까요?</AlertDialogTitle>
        </AlertDialogHeader>
        {shown && (
          <TransferLine
            from={shown.from}
            to={shown.to}
            amount={formatMoney(shown.amount, home)}
            done={false}
            avatarOf={avatarOf}
            pc={false}
          />
        )}
        <AlertDialogDescription>다시 남은 송금으로 돌아가요.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>그대로 두기</AlertDialogCancel>
          {/* 잉크 — 되돌릴 수 있는 동작이라 빨강(위험)이 아니다. 크기는 공용 확인 창 바닥 줄(모바일 반씩 46 · PC 42)을 따른다 */}
          <AlertDialogAction
            className="bg-ink-900 text-white hover:bg-ink-900/90"
            onClick={() => {
              if (row) onConfirm(row);
              onClose();
            }}
          >
            표시 풀기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
