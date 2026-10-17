"use client";

import { useState } from "react";

import type { Voucher } from "@/entities/voucher";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { type RenderVoucherTarget, VoucherFormPanel } from "./voucher-form-panel";

type VoucherFormDialogProps = {
  tripId: string;
  open: boolean;
  /** 고치는 바우처(연 때의 것). 새로 넣으면 null */
  voucher: Voucher | null;
  onClose: () => void;
  onToast: (text: string) => void;
  renderTarget: RenderVoucherTarget;
};

/**
 * 바우처 추가 · 수정 창 — 1024 아래는 아래에서 올라오는 시트(r22 위 모서리 · 최대 88%), 이상은 가운데 480 창(r22 · 최대 86%).
 * 열 때마다 새로 그리고, 닫히는 동안은 마지막 내용을 그린다. 저장 중에는 닫히지 않는다
 */
export function VoucherFormDialog({
  tripId,
  open,
  voucher,
  onClose,
  onToast,
  renderTarget,
}: VoucherFormDialogProps) {
  const [locked, setLocked] = useState(false);
  const shown = useHeldWhileClosing(open, voucher);
  const opens = useOpenCount(open);
  return (
    <Dialog open={open} locked={locked} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 flex max-h-[88dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[86dvh] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        <VoucherFormPanel
          key={opens}
          tripId={tripId}
          voucher={shown}
          onClose={onClose}
          onToast={onToast}
          onLockChange={setLocked}
          renderTarget={renderTarget}
        />
      </DialogContent>
    </Dialog>
  );
}
