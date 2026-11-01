"use client";

import { useState } from "react";

import type { TaxRefund } from "@/entities/tax-refund";
import { useHeldWhileClosing, useOpenCount, useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { useRefundForm } from "../model/use-refund-form";
import { DeleteRefundButton } from "./delete-refund-button";
import {
  OwnerField,
  ProviderField,
  ReferenceFields,
  StoreField,
  WhenFields,
} from "./refund-form-fields";
import { AmountFields, MemoField, MethodFields } from "./refund-money-fields";

/** 열린 폼 — 고치는 건(새 건이면 null) */
export type RefundFormTarget = { refund: TaxRefund | null };

type RefundFormDialogProps = {
  tripId: string;
  /** null 이면 닫혀 있다 */
  target: RefundFormTarget | null;
  /** 여행 통화(기준 통화가 맨 앞) */
  currencies: string[];
  /** 새 건의 처음 통화 */
  startCurrency: string;
  onClose: () => void;
  onToast: (text: string) => void;
};

/**
 * 택스 리펀 추가 · 수정 — 모바일 바텀시트 · PC 가운데 480. 매장 → (누구 것) → 사업자 → 구매 날짜 · 시각 → 금액 · 환급 예정액 → 환급 방법 →
 * 거래번호 · 바코드 번호 · 신청 사이트 → 메모. 닫히는 동안 내용을 유지하고, 열 때마다 새로 그린다
 */
export function RefundFormDialog({ target, onClose, ...rest }: RefundFormDialogProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const count = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <SheetDialog
      open={open}
      onClose={onClose}
      title={shown?.refund ? "환급 기록 고치기" : "환급 기록 추가"}
      locked={locked}
    >
      {shown && (
        <RefundFormBody
          key={count}
          refund={shown.refund}
          onClose={onClose}
          onLockChange={setLocked}
          {...rest}
        />
      )}
    </SheetDialog>
  );
}

type RefundFormBodyProps = Omit<RefundFormDialogProps, "target"> & {
  refund: TaxRefund | null;
  onLockChange: (locked: boolean) => void;
};

/** 칸 묶음 — 상태는 useRefundForm */
function RefundFormBody({
  tripId,
  refund,
  currencies,
  startCurrency,
  onClose,
  onToast,
  onLockChange,
}: RefundFormBodyProps) {
  const form = useRefundForm(tripId, refund, startCurrency, onClose, onToast);
  useReportLock(form.pending, onLockChange);
  return (
    <div className="flex flex-col gap-4">
      <StoreField form={form} autoFocus={refund === null} />
      <OwnerField form={form} />
      <ProviderField form={form} />
      <WhenFields form={form} />
      <AmountFields form={form} currencies={currencies} />
      <MethodFields form={form} />
      <ReferenceFields form={form} />
      <MemoField form={form} />
      {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
      <div className="flex items-center gap-2">
        {form.canDelete && <DeleteRefundButton disabled={form.pending} onConfirm={form.destroy} />}
        <Button
          variant="chip"
          size="form"
          className="ml-auto w-24"
          disabled={form.pending}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="form"
          className="w-36"
          disabled={!form.canSave || form.pending}
          onClick={form.submit}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
