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
  /**
   * 풀리는 체크리스트 연결(완료 포함) — stay 는 숙소에 연결한 항목, cards 는 숙소에는 없고 연결 카드에만 붙은 항목
   * (카드를 「지우기」 할 때만 풀린다)
   */
  checklist: { stay: number; cards: number };
  /** 풀리는 바우처 연결 — 체크리스트와 같은 기준 */
  vouchers: { stay: number; cards: number };
  onCancel: () => void;
  /** deleteCards — 카드도 지우기 */
  onConfirm: (deleteCards: boolean) => void;
};

/** 결제가 있을 때 확인창 본문 끝에 붙이는 말 */
const PAID_NOTE = " 결제 기록(가계부)도 함께 지워져요.";

/**
 * 숙소 삭제 확인 — 연결 카드가 있으면 「연결된 일정 카드 N개도 지울까요?」(남기기 / 지우기), 없으면 「숙소를 삭제할까요?」.
 * 결제가 있으면 어느 쪽이든 가계부 기록도 지워진다고, 체크리스트 · 바우처 연결이 있으면 연결만 풀리고 노트에 남는다고 덧붙인다
 */
export function DeleteStayConfirm({
  open,
  count,
  paid,
  checklist,
  vouchers,
  onCancel,
  onConfirm,
}: DeleteStayConfirmProps) {
  const paidNote = paid ? PAID_NOTE : "";
  const stayNote =
    noteText(checklistUnlinkNote(checklist.stay)) + noteText(voucherUnlinkNote(vouchers.stay));
  const cardNote = cardUnlinkNote(checklist.cards, vouchers.cards);
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        {count > 0 ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>연결된 일정 카드 {count}개도 지울까요?</AlertDialogTitle>
              <AlertDialogDescription>
                남기면 일반 장소 카드로 바뀌어요.{paidNote}
                {stayNote}
                {cardNote}
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
                숙소 정보가 지워져요.{paidNote} 장소는 보관함에 남아요.{stayNote}
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

/** 문장 앞에 띄어쓰기를 붙인다. 없으면 빈 글자 */
function noteText(note: string | null): string {
  return note ? ` ${note}` : "";
}

/** 카드를 「지우기」 할 때만 풀리는 연결 — 숙소에는 없고 카드에만 붙은 체크리스트 · 바우처 */
function cardUnlinkNote(checklist: number, vouchers: number): string {
  const parts = [
    checklist > 0 ? `체크리스트 ${checklist}개` : null,
    vouchers > 0 ? `바우처 ${vouchers}개` : null,
  ].filter(Boolean);
  return parts.length > 0
    ? ` 카드를 지우면 카드에 연결된 ${parts.join(" · ")}도 연결만 풀려요.`
    : "";
}
