"use client";

import type { ExpenseList } from "../../model/use-expense-list";
import { RefundList } from "../refund/refund-list";
import { ScreenModal } from "./screen-modal";

type RefundModalProps = { tripId: string; list: ExpenseList; open: boolean; onClose: () => void };

/** PC 「환급」 — 모바일 탭 내용을 그대로 가운데 480×760 창(ScreenModal)으로. 상세 · 폼은 그 위에 겹쳐 연다 */
export function RefundModal({ tripId, list, open, onClose }: RefundModalProps) {
  return (
    <ScreenModal open={open} onClose={onClose} title="환급" subtitle={list.trip.title}>
      {open && <RefundList tripId={tripId} trip={list.trip} onToast={list.showToast} />}
    </ScreenModal>
  );
}
