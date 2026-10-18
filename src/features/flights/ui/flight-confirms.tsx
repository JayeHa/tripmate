"use client";

import { checklistUnlinkNote } from "@/entities/checklist";
import { voucherUnlinkNote } from "@/entities/voucher";
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

type DeleteFlightConfirmProps = {
  open: boolean;
  /** 일정 카드가 있다 — 함께 지워진다고 알린다 */
  hasCard: boolean;
  /** 결제(가계부 비용)가 있다 — 함께 지워진다고 알린다 */
  paid: boolean;
  /** 이 항공편에 연결된 체크리스트 항목 수(완료 포함) — 연결만 풀린다고 알린다 */
  checklistCount: number;
  /** 이 항공편(과 카드)에 연결된 바우처 수 — 연결만 풀린다고 알린다 */
  voucherCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * 항공편 삭제 확인 — 일정 카드가 있으면 그 카드 · 메모도, 결제가 있으면 가계부 기록도 함께 지워진다고,
 * 연결된 체크리스트 · 바우처가 있으면 연결만 풀리고 노트에 남는다고 알린다
 */
export function DeleteFlightConfirm({
  open,
  hasCard,
  paid,
  checklistCount,
  voucherCount,
  onCancel,
  onConfirm,
}: DeleteFlightConfirmProps) {
  const checklistNote = checklistUnlinkNote(checklistCount);
  const voucherNote = voucherUnlinkNote(voucherCount);
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>항공편을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasCard
              ? "일정 타임라인의 항공편 카드와 그 메모도 함께 지워져요."
              : "항공편 정보가 지워져요."}
            {paid && " 결제 기록(가계부)도 함께 지워져요."}
            {checklistNote && ` ${checklistNote}`}
            {voucherNote && ` ${voucherNote}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirm}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type CardOutConfirmProps = {
  open: boolean;
  /** 저장(true) · 취소(false) — 바깥 · Esc 는 취소 */
  onResolve: (ok: boolean) => void;
};

/** 탑승일을 여행 기간 밖으로 옮길 때 — 일정 카드와 그 메모가 지워진다고 묻는다 */
export function CardOutConfirm({ open, onResolve }: CardOutConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onResolve(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>일정의 항공편 카드를 지울까요?</AlertDialogTitle>
          <AlertDialogDescription>
            탑승일이 여행 기간 밖이라 일정에서 빠져요. 카드에 단 메모도 함께 지워져요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onResolve(false)}>취소</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={() => onResolve(true)}>
            지우고 저장
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
