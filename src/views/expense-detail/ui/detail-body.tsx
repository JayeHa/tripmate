import type { ReactNode } from "react";

import {
  ExpenseBadge,
  ExpenseCategoryIcon,
  type ExpenseRowView,
  type ExpenseWithSplits,
  type PersonRef,
} from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import { detailDateText, paymentStatusText } from "../lib/detail";

type DetailBodyProps = {
  expense: ExpenseWithSplits;
  row: ExpenseRowView;
  trip: { start_date: string; end_date: string };
};

/**
 * 비용 상세의 내용 — 카테고리(타일 28 + 이름 · 「합계 제외」) · 항목명 17/700 · 금액 28/800(외화면 옆에 ≈ 원화),
 * 표(날짜 · 일정 · 결제수단 · 결제한 사람 · 함께한 사람 · 결제 상태) · 메모(있을 때만). 일정은 연결했을 때만 줄이 있다
 */
export function DetailBody({ expense, row, trip }: DetailBodyProps) {
  const memo = expense.memo?.trim();
  return (
    <div className="flex flex-col gap-5 px-5 pt-2 pb-8">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-button bg-surface-sunken">
            <ExpenseCategoryIcon category={row.category} className="size-4" />
          </span>
          <span className="text-[13px] text-ink-400">{row.categoryLabel}</span>
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </div>
        <h2 className="truncate text-[17px] font-bold text-ink-900">{row.name}</h2>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">
            {row.amountText}
          </span>
          {row.approxText && <span className="text-sm text-ink-400">{row.approxText}</span>}
        </p>
      </div>
      <dl className="flex flex-col border-t border-surface-muted">
        <Field label="날짜">{detailDateText(expense.spent_on, trip)}</Field>
        {row.linkName && <Field label="일정">{row.linkName}</Field>}
        <Field label="결제수단">{row.methodLabel}</Field>
        <Field label="결제한 사람">{row.payer ? <People people={[row.payer]} /> : "각자 냄"}</Field>
        <Field label="함께한 사람">
          <People people={row.togetherPeople} />
        </Field>
        <Field label="결제 상태">{paymentStatusText(expense.paid, expense.due_date)}</Field>
      </dl>
      {memo && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-bold text-ink-400">메모</h3>
          <p className="rounded-memo bg-surface-memo px-3.5 py-3 text-sm leading-[1.55] whitespace-pre-line text-ink-800">
            {memo}
          </p>
        </section>
      )}
    </div>
  );
}

type FieldProps = { label: string; children: ReactNode };

/** 표 한 줄 — 왼쪽 이름 84 회색, 오른쪽 값 14/600 */
function Field({ label, children }: FieldProps) {
  return (
    <div className="flex min-h-11.5 items-center gap-3 border-b border-surface-muted py-2.5">
      <dt className="w-21 shrink-0 text-sm text-ink-400">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-semibold text-ink-900">{children}</dd>
    </div>
  );
}

type PeopleProps = { people: { person: PersonRef; name: string }[] };

/** 사람들 — 첫 글자 아바타 22 + 이름. 정산 인원은 분홍 아바타 */
function People({ people }: PeopleProps) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1.5">
      {people.map(({ person, name }) => (
        <span key={`${person.kind}-${person.id}`} className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex size-5.5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white",
              person.kind === "guest" ? "bg-guest" : "bg-primary",
            )}
          >
            {name.slice(0, 1)}
          </span>
          {name}
        </span>
      ))}
    </span>
  );
}
