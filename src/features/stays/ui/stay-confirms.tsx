"use client";

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

type PruneCardsConfirmProps = {
  /** 밀려나는 카드 수. null 이면 닫힘 */
  count: number | null;
  /** 남기기(false) · 지우기(true) · 취소(null) */
  onResolve: (prune: boolean | null) => void;
};

/** 숙박 기간을 줄여 밖으로 밀려난 연결 카드를 어떻게 할지 — 바깥 · Esc 는 취소(저장하지 않는다) */
export function PruneCardsConfirm({ count, onResolve }: PruneCardsConfirmProps) {
  return (
    <AlertDialog open={count !== null} onOpenChange={(open) => !open && onResolve(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>숙박 기간 밖 카드 {count}개를 지울까요?</AlertDialogTitle>
          <AlertDialogDescription>
            직접 넣은 방문일 수도 있어서 바로 지우지 않았어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onResolve(false)}>남기기</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={() => onResolve(true)}>
            지우기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type DeleteStayConfirmProps = {
  open: boolean;
  /** 연결된 일정 카드 수 — 0 이면 숙소만 묻는다 */
  count: number;
  /** 결제(가계부 비용)가 있다 — 함께 지워진다고 알린다 */
  paid: boolean;
  onCancel: () => void;
  /** deleteCards — 카드도 지우기 */
  onConfirm: (deleteCards: boolean) => void;
};

/** 결제가 있을 때 확인창 본문 끝에 붙이는 말 */
const PAID_NOTE = " 결제 기록(가계부)도 함께 지워져요.";

/**
 * 숙소 삭제 확인 — 연결 카드가 있으면 「연결된 일정 카드 N개도 지울까요?」(남기기 / 지우기), 없으면 「숙소를 삭제할까요?」.
 * 결제가 있으면 어느 쪽이든 가계부 기록도 지워진다고 덧붙인다
 */
export function DeleteStayConfirm({
  open,
  count,
  paid,
  onCancel,
  onConfirm,
}: DeleteStayConfirmProps) {
  const paidNote = paid ? PAID_NOTE : "";
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        {count > 0 ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>연결된 일정 카드 {count}개도 지울까요?</AlertDialogTitle>
              <AlertDialogDescription>
                남기면 일반 장소 카드로 바뀌어요.{paidNote}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => onConfirm(false)}>남기기</AlertDialogCancel>
              <AlertDialogAction variant="danger" onClick={() => onConfirm(true)}>
                지우기
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>숙소를 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                숙소 정보가 지워져요.{paidNote} 장소는 보관함에 남아요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction variant="danger" onClick={() => onConfirm(false)}>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
