import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  ExpenseCategoryIcon,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
} from "@/entities/expense";
import { itemName } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { cn } from "@/shared/lib/utils";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Input } from "@/shared/ui/input";
import { Segmented } from "@/shared/ui/segmented";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { dayOptions, dayOptionText } from "../lib/day-options";
import type { ExpenseFormState } from "../model/use-expense-form";

type FormProps = { form: ExpenseFormState };

type FieldLabelProps = { htmlFor?: string; required?: boolean; children: React.ReactNode };

/** 칸 이름 — 13/700 #444, 필수 칸은 빨간 * */
export function FieldLabel({ htmlFor, required, children }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-bold text-ink-700">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

const PAYMENT_OPTIONS = PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABEL[value],
}));

/** 카테고리 — 아이콘 칩(P2). 고른 칩은 잉크 바탕이라 아이콘도 흰색 */
export function CategoryField({ form }: FormProps) {
  return (
    <div role="group" aria-labelledby="expense-category" className="flex flex-col gap-3">
      <span id="expense-category">
        <FieldLabel required>카테고리</FieldLabel>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {EXPENSE_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            selected={form.category === c}
            onClick={() => form.setCategory(c)}
            className="gap-1.25 px-3"
          >
            <ExpenseCategoryIcon category={c} tone={false} className="size-3.5" />
            {EXPENSE_CATEGORY_LABEL[c]}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

type DayFieldProps = FormProps & { trip: Trip };

/** 날짜 — 44 상자(달력 아이콘 + 「day 2 · 11.1 (일)」), 누르면 여행준비 · day N 시트. 연결 일정과 날이 다르면 아래에 알린다 */
export function DayField({ form, trip }: DayFieldProps) {
  const [open, setOpen] = useState(false);
  const options = dayOptions(trip.start_date, trip.end_date);
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor="expense-day" required>
        날짜
      </FieldLabel>
      <button
        id="expense-day"
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-memo border border-input px-3 text-left"
      >
        <CalendarDays className="size-4 text-primary" aria-hidden="true" />
        <span className="flex-1 text-[15px] font-bold text-ink-900">
          {dayOptionText(options, form.spentOn)}
        </span>
        <ChevronDown className="size-4 text-ink-450" aria-hidden="true" />
      </button>
      {form.link.dayMismatch && (
        <span className="text-xs font-semibold text-status-wait-text">
          연결된 일정은 {form.link.dayMismatch}이에요
        </span>
      )}
      <SheetDialog open={open} onClose={() => setOpen(false)} title="날짜 선택">
        {options.map((o) => {
          const on = o.value === form.spentOn;
          return (
            <button
              key={o.value || "prep"}
              type="button"
              onClick={() => {
                form.setSpentOn(o.value);
                setOpen(false);
              }}
              className="flex h-13.5 w-full items-center gap-2 text-[17px]"
            >
              <span className={cn("font-bold", on ? "text-primary" : "text-ink-900")}>
                {o.label}
              </span>
              <span className="flex-1 text-left text-ink-400">{o.sub}</span>
              {on && <Check className="size-6 text-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </SheetDialog>
    </div>
  );
}

/** 항목명 — 44 입력 칸. 일정에 연결했으면 비워 둬도 되고, 그 일정 이름이 자리 글자로 보인다(저장도 그 이름) */
export function NameField({ form }: FormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor="expense-name" required>
        항목명
      </FieldLabel>
      <Input
        id="expense-name"
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
        maxLength={100}
        placeholder={form.link.linked ? itemName(form.link.linked) : "항목명을 입력해 주세요"}
      />
    </div>
  );
}

/** 결제수단 — 세 칸 세그먼트(현금 · 카드 · 교통카드), 시트 없이 바로 고른다 */
export function PaymentField({ form }: FormProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required>결제수단</FieldLabel>
      <Segmented
        aria-label="결제수단"
        options={PAYMENT_OPTIONS}
        value={form.paymentMethod}
        onChange={form.setPaymentMethod}
        fill
      />
    </div>
  );
}
