import { categoryBarClass, EXPENSE_CATEGORY_LABEL, sumExpenses } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { FilterChip } from "@/shared/ui/filter-chip";

import { type CategoryPick, categoryTitle, dayBars } from "../../lib/category-detail";
import { categoryShares } from "../../lib/dashboard";
import { periodLabel, sortedCurrencies } from "../../lib/period";
import type { ExpenseList } from "../../model/use-expense-list";
import { CurrencyLine } from "../mobile/summary-card";
import { CategoryExpenseRow } from "./category-expense-row";

type CategoryDetailProps = {
  list: ExpenseList;
  pick: CategoryPick;
  onPick: (pick: CategoryPick) => void;
};

/**
 * 카테고리 상세의 내용 — 칩(전체 + 쓴 카테고리, 많이 쓴 순) · 「숙소 · 3건 · 전체의 32%」 · 금액 28/800 · 1인당(일행 여행) ·
 * 통화별 줄 · 날짜별 막대(이틀 이상일 때만, 지출 없는 여행 날짜도 칸) · 날짜별 목록. 합계에 넣는 지출만 센다. 모바일 화면과 PC 창이 같이 쓴다
 */
export function CategoryDetail({ list, pick, onPick }: CategoryDetailProps) {
  const { trip } = list;
  const home = trip.home_currency;
  const shares = categoryShares(list.expenses, home, trip.exchange_rates);
  // 여행준비 · day 1 … N(지출 없는 날 포함) — 막대는 빈 날도 칸을 두고, 목록은 지출이 있는 날만
  const allDays = list.sectionsOf((e) => e.counted && (pick === "all" || e.category === pick));
  const sections = allDays.filter((s) => s.rows.length > 0);
  const expenses = sections.flatMap((s) => s.expenses);
  const totals = sumExpenses(expenses, home, trip.exchange_rates);
  const percent = list.total.home > 0 ? Math.round((totals.home / list.total.home) * 100) : 0;
  const bars = dayBars(allDays.map((s) => ({ period: s.period, total: s.total.home })));
  return (
    <>
      <div className="flex gap-1.5 overflow-x-auto px-5 pt-1 pb-3">
        {(["all", ...shares.map((s) => s.category)] as CategoryPick[]).map((c) => (
          <FilterChip key={c} selected={c === pick} onClick={() => onPick(c)}>
            {c === "all" ? "전체" : EXPENSE_CATEGORY_LABEL[c]}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-col gap-1 px-5 pt-1.5 pb-4">
        <span className="text-sm font-bold text-ink-450">
          {categoryTitle(pick, expenses.length, percent)}
        </span>
        <span className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">
          {formatMoney(totals.home, home)}
        </span>
        {!list.solo && (
          <span className="text-[13px] text-ink-400">
            1인당 약 {formatMoney(Math.round(totals.home / list.everyone), home)}
          </span>
        )}
        <div className="flex flex-col pt-2">
          {sortedCurrencies(totals.byCurrency, home).map(([code, amount]) => (
            <div key={code} className="border-b border-surface-muted">
              <CurrencyLine code={code} amount={amount} home={home} rates={trip.exchange_rates} />
            </div>
          ))}
        </div>
        {bars && (
          <div aria-hidden="true" className="flex h-22 items-end gap-2.5 pt-3">
            {bars.map((b) => (
              <div
                key={b.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span
                  className={cn(
                    "w-full max-w-7 rounded-t-tag",
                    b.height === 0 && "invisible",
                    pick === "all" ? "bg-brand" : categoryBarClass(pick),
                  )}
                  style={{ height: b.height }}
                />
                <span className="text-[11px] text-ink-400">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {sections.length === 0 && (
        <p className="px-5 py-10 text-center text-[13px] text-ink-350">
          이 카테고리에는 아직 지출이 없어요.
        </p>
      )}
      {sections.map((s) => {
        const { label, date } = periodLabel(s.period, trip.start_date);
        return (
          <section
            key={String(s.period)}
            className="flex flex-col border-t-8 border-surface-sunken px-5 pt-3.5 pb-1.5"
          >
            <div className="flex items-baseline pb-1.5 text-[13px] font-semibold text-ink-450">
              <h3 className="flex-1">
                {s.period === "prep" ? label : `${label} · ${date.replace("/", " (")})`}
              </h3>
              <span>{formatMoney(s.total.home, home)}</span>
            </div>
            {s.rows.map((row) => (
              <CategoryExpenseRow key={row.id} row={row} list={list} />
            ))}
          </section>
        );
      })}
    </>
  );
}
