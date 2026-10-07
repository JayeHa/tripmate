"use client";

import { useState } from "react";

import {
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  ExpenseCategoryTile,
  periodOf,
  type PersonRef,
} from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import { periodLabel } from "../../lib/period";
import { personExpenses, type PersonExpenseTab } from "../../lib/settle-person";
import type { ExpenseList } from "../../model/use-expense-list";

type PersonExpenseListProps = {
  list: ExpenseList;
  person: PersonRef;
  /** 보고 있는 사람이 나인가 — 「내 몫 합계」 */
  me: boolean;
  name: string;
};

/**
 * 사람 상세 아래 — 탭 「결제한 비용 N | 함께한 비용 N」, 오른쪽 「결제 합계 · 내 몫 합계」, 줄마다 타일 · 이름 · 「day 1 · 식비」 · 금액.
 * 결제한 비용은 총액, 함께한 비용은 그 사람 몫이다
 */
export function PersonExpenseList({ list, person, me, name }: PersonExpenseListProps) {
  const [tab, setTab] = useState<PersonExpenseTab>("paid");
  const { trip } = list;
  const home = trip.home_currency;
  const of = (t: PersonExpenseTab) =>
    personExpenses(list.expenses, person, t, home, trip.exchange_rates);
  const counts = { paid: of("paid").length, with: of("with").length };
  const rows = of(tab);
  const total = rows.reduce((n, r) => n + r.amount, 0);
  return (
    <section className="flex flex-col gap-3 border-t-8 border-surface-sunken px-5 py-4.5">
      <div role="tablist" className="flex gap-5 border-b border-surface-muted">
        {(["paid", "with"] as const).map((t) => (
          <button
            type="button"
            role="tab"
            key={t}
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px flex h-10 items-center gap-1 border-b-2 text-[15px]",
              tab === t
                ? "border-ink-900 font-extrabold text-ink-900"
                : "border-transparent font-semibold text-ink-350",
            )}
          >
            {t === "paid" ? "결제한 비용" : "함께한 비용"}
            <span className="text-[13px] font-bold">{counts[t]}</span>
          </button>
        ))}
      </div>
      <p className="text-right text-[13px] text-ink-450">
        {tab === "paid" ? "결제 합계" : `${me ? "내" : name} 몫 합계`}{" "}
        <b className="text-ink-900">{formatMoney(total, home)}</b>
      </p>
      {rows.map(({ expense, amount }) => {
        const category = expense.category as ExpenseCategory;
        const { label } = periodLabel(periodOf(expense, trip), trip.start_date);
        return (
          <div key={expense.id} className="flex items-center gap-3 py-1">
            <ExpenseCategoryTile category={category} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-ink-700">{expense.name}</span>
              <span className="text-xs text-ink-400">
                {label} · {EXPENSE_CATEGORY_LABEL[category] ?? "기타"}
              </span>
            </div>
            <span className="text-[15px] font-extrabold whitespace-nowrap text-ink-900">
              {formatMoney(amount, home)}
            </span>
          </div>
        );
      })}
    </section>
  );
}
