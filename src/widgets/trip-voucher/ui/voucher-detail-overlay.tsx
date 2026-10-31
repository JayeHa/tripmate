"use client";

import { useState } from "react";

import type { Voucher } from "@/entities/voucher";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";

import { MobileVoucherDetail } from "./mobile-voucher-detail";
import { TripVoucherForm } from "./trip-voucher-form";
import { TripVoucherViewer } from "./trip-voucher-viewer";

type VoucherDetailOverlayProps = {
  tripId: string;
  /** 열 바우처 id, 닫혀 있으면 null */
  voucherId: string | null;
  onClose: () => void;
  onToast: (text: string) => void;
};

/**
 * 다른 화면 위에 바로 여는 바우처 상세(모바일 전체 화면) — 상세 · 「현장에서 보여주기」 뷰어 · 수정 창을 함께 쥔다.
 * 노트 목록을 거치지 않아 뒤로(←)가 연 화면으로 돌아간다. 예: 홈 「오늘 쓸 바우처」 줄.
 * 뷰어에서 지우면 상세도 닫는다
 */
export function VoucherDetailOverlay({
  tripId,
  voucherId,
  onClose,
  onToast,
}: VoucherDetailOverlayProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  // 닫히는 동안 수정 창이 새 바우처 폼으로 바뀌지 않게 고치던 바우처를 쥔다
  const heldEditing = useHeldWhileClosing(editing !== null, editing);

  /** 상세를 닫는다 — 뷰어도 함께 */
  function close() {
    setViewerOpen(false);
    onClose();
  }

  return (
    <>
      <MobileVoucherDetail
        tripId={tripId}
        id={voucherId}
        onClose={close}
        onEdit={setEditing}
        onShow={() => setViewerOpen(true)}
        onToast={onToast}
      />
      <TripVoucherViewer
        tripId={tripId}
        voucherId={viewerOpen ? voucherId : null}
        onClose={() => setViewerOpen(false)}
        onEdit={setEditing}
        onDeleted={close}
        onToast={onToast}
      />
      <TripVoucherForm
        tripId={tripId}
        open={editing !== null}
        voucher={heldEditing}
        onClose={() => setEditing(null)}
        onToast={onToast}
      />
    </>
  );
}
