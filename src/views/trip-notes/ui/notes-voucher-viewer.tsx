"use client";

import { VoucherViewer } from "@/features/voucher";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";

import type { NotesState } from "../model/use-notes";
import { useVoucherDetail } from "../model/use-voucher-detail";

type NotesVoucherViewerProps = { tripId: string; notes: NotesState };

/**
 * 노트에서 연 뷰어 — 고른 바우처를 그린다(주인 · 연결 · 날짜 · 번호 글은 상세와 같은 것). 닫히는 동안에는 마지막 바우처를 그린다.
 * 지우면 뷰어와 상세를 함께 닫는다
 */
export function NotesVoucherViewer({ tripId, notes }: NotesVoucherViewerProps) {
  const { voucherViewer, voucherDetail } = notes;
  // id 를 잡는다 — 상세 객체는 렌더마다 새로 만들어진다
  const heldId = useHeldWhileClosing(voucherViewer.open, voucherDetail.id);
  const detail = useVoucherDetail(tripId, heldId);
  return (
    <VoucherViewer
      tripId={tripId}
      open={voucherViewer.open && detail !== null}
      content={detail}
      onClose={voucherViewer.close}
      onEdit={notes.voucherForm.openEdit}
      onDeleted={voucherDetail.close}
      onToast={notes.showToast}
    />
  );
}
