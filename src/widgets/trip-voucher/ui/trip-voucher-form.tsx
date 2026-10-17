"use client";

import type { Voucher } from "@/entities/voucher";
import { VoucherFormDialog } from "@/features/voucher";

import { VoucherTargetField } from "./voucher-target-field";

type TripVoucherFormProps = {
  tripId: string;
  open: boolean;
  /** 고치는 바우처(연 때의 것). 새로 넣으면 null */
  voucher: Voucher | null;
  onClose: () => void;
  onToast: (text: string) => void;
};

/** 바우처 추가 · 수정 창 — 「연결된 일정」 칸은 체크리스트와 같은 고르기 + 그 날짜 안내 */
export function TripVoucherForm({ tripId, open, voucher, onClose, onToast }: TripVoucherFormProps) {
  return (
    <VoucherFormDialog
      tripId={tripId}
      open={open}
      voucher={voucher}
      onClose={onClose}
      onToast={onToast}
      renderTarget={(value, onChange) => (
        <VoucherTargetField tripId={tripId} value={value} onChange={onChange} />
      )}
    />
  );
}
