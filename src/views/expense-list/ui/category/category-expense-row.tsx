import { ExpenseCategoryTile, type ExpenseRowView, whoOf } from "@/entities/expense";

import type { ExpenseList } from "../../model/use-expense-list";

type CategoryExpenseRowProps = { row: ExpenseRowView; list: ExpenseList };

/**
 * 카테고리 상세의 지출 한 줄 — 타일 28 · 이름 14/600 · 아래 「결제 예정 · 정원 결제 · 2명 모두」(혼자 쓰는 가계부는 결제 예정만),
 * 오른쪽 금액 16/800 · 외화면 ≈ 원화
 */
export function CategoryExpenseRow({ row, list }: CategoryExpenseRowProps) {
  const meta = [
    row.planned ? "결제 예정" : "",
    list.solo ? "" : whoOf(row, list.displayNameOf, list.everyone).text,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex items-center gap-3 py-2.5">
      <ExpenseCategoryTile category={row.category} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-ink-700">{row.name}</span>
        {meta && <span className="truncate text-xs text-ink-400">{meta}</span>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-px">
        <span className="text-base font-extrabold whitespace-nowrap text-ink-900">
          {row.amountText}
        </span>
        {row.approxText && <span className="text-[11px] text-ink-400">{row.approxText}</span>}
      </div>
    </div>
  );
}
