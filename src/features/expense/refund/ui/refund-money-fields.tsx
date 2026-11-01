"use client";

import { REFUND_METHOD_LABEL, REFUND_METHODS } from "@/entities/tax-refund";
import { currencyName, decimalsOf } from "@/shared/lib/money";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Input } from "@/shared/ui/input";
import { Segmented } from "@/shared/ui/segmented";
import { Textarea } from "@/shared/ui/textarea";

import { MEMO_MAX, METHOD_NOTE_MAX } from "../lib/refund-form";
import type { RefundFormState } from "../model/use-refund-form";
import { FieldLabel } from "./refund-form-fields";

type FieldProps = { form: RefundFormState };

type MoneyFieldsProps = {
  form: RefundFormState;
  /** 여행 통화 — 둘 이상이면 칩으로 고른다 */
  currencies: string[];
};

/** 방법 메모 자리 글 — 방법마다 */
const NOTE_PLACEHOLDER = {
  card: "어떤 카드인지 (예: 쿠팡 와우카드)",
  cash: "어느 카운터인지",
  app: "어떤 앱 · 페이인지",
  bank: "어느 계좌인지",
} as const;

type AmountInputProps = {
  id: string;
  value: string;
  currency: string;
  onChange: (value: string) => void;
};

/** 금액 한 칸 — 오른쪽 정렬 숫자 + 통화 이름 */
function AmountInput({ id, value, currency, onChange }: AmountInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={decimalsOf(currency) === 0 ? "numeric" : "decimal"}
        autoComplete="off"
        placeholder="0"
        className="flex-1 text-right tabular-nums"
      />
      <span className="w-6 shrink-0 text-[15px] font-semibold text-ink-700">
        {currencyName(currency)}
      </span>
    </div>
  );
}

/** 구매 금액 · 환급 예정액(같은 통화) · 통화 칩 */
export function AmountFields({ form, currencies }: MoneyFieldsProps) {
  const { amount, refundAmount, currency } = form.draft;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="refund-amount">
            <FieldLabel optional>구매 금액</FieldLabel>
          </label>
          <AmountInput
            id="refund-amount"
            value={amount}
            currency={currency}
            onChange={(v) => form.set("amount", v)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="refund-refund-amount">
            <FieldLabel optional>환급 예정액</FieldLabel>
          </label>
          <AmountInput
            id="refund-refund-amount"
            value={refundAmount}
            currency={currency}
            onChange={(v) => form.set("refundAmount", v)}
          />
        </div>
      </div>
      {currencies.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="통화">
          {currencies.map((c) => (
            <FilterChip
              key={c}
              size="sm"
              selected={c === currency}
              onClick={() => form.set("currency", c)}
            >
              {currencyName(c)}
            </FilterChip>
          ))}
        </div>
      )}
    </div>
  );
}

/** 환급 방법 세그먼트 + 방법 메모(어떤 카드 · 어느 카운터) */
export function MethodFields({ form }: FieldProps) {
  const { method, methodNote } = form.draft;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>환급 방법</FieldLabel>
      <Segmented
        options={REFUND_METHODS.map((m) => ({ value: m, label: REFUND_METHOD_LABEL[m] }))}
        value={method}
        onChange={(m) => form.set("method", m)}
        aria-label="환급 방법"
        fill
      />
      <Input
        value={methodNote}
        onChange={(e) => form.set("methodNote", e.target.value)}
        maxLength={METHOD_NOTE_MAX}
        placeholder={NOTE_PLACEHOLDER[method]}
        aria-label="환급 방법 메모"
      />
    </div>
  );
}

/** 메모 */
export function MemoField({ form }: FieldProps) {
  const { memo } = form.draft;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between">
        <FieldLabel optional>메모</FieldLabel>
        <span className="text-xs font-medium text-ink-350">
          {memo.length}/{MEMO_MAX}
        </span>
      </span>
      <Textarea
        value={memo}
        onChange={(e) => form.set("memo", e.target.value)}
        maxLength={MEMO_MAX}
        rows={3}
        aria-label="메모"
        placeholder="산 물건 · 수수료 · 받는 데 걸리는 기간"
        className="resize-none text-sm/normal"
      />
    </div>
  );
}
