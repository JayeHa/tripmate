import { EXPENSE_CATEGORY_LABEL } from "@/entities/expense";
import { itemName, type ScheduleItem } from "@/entities/schedule-item";

import { dayOptionText } from "../lib/day-options";
import type { ExpenseFormState } from "../model/use-expense-form";

type QuickSummaryProps = { form: ExpenseFormState; linked: ScheduleItem };

/**
 * 빠른 입력(일정에서 연 비용)의 맨 위 요약 — 일정 이름 · 「day 2 · 11.1 (일) · 관광」 · 가계부에서 바꿀 수 있다는 안내.
 * 숨긴 칸(일정 연결 · 카테고리 · 날짜)의 값을 글로만 보인다
 */
export function QuickSummary({ form, linked }: QuickSummaryProps) {
  const line = [
    dayOptionText(form.link.days, form.spentOn),
    form.category && EXPENSE_CATEGORY_LABEL[form.category],
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex flex-col gap-2 px-5 pt-1 pb-4.5">
      <span className="truncate text-xl font-extrabold tracking-[-0.02em] text-ink-900">
        {itemName(linked)}
      </span>
      <span className="text-sm text-ink-500">{line}</span>
      <span className="text-xs text-ink-350">
        날짜·카테고리·일정 연결은 나중에 가계부에서 바꿀 수 있어요.
      </span>
    </div>
  );
}
