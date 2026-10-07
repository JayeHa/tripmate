"use client";

import Link from "next/link";
import { useRef } from "react";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  personKey,
  sumExpenses,
} from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";

import { baseRateLine } from "../../lib/base-rate";
import { calendarCells } from "../../lib/calendar";
import { filtersActive, matchesFilters } from "../../lib/filters";
import { useCalendarScroll } from "../../model/use-calendar-scroll";
import type { ExpenseList } from "../../model/use-expense-list";
import { usePcList } from "../../model/use-pc-list";
import { SummaryCard } from "../mobile/summary-card";
import { DateRail } from "./date-rail";
import { ExpenseTable } from "./expense-table";
import { FilterBar } from "./filter-bar";

type PcExpenseListProps = { tripId: string; list: ExpenseList };

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABEL[c],
}));
const METHOD_OPTIONS = PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABEL[m] }));

/**
 * PC 가계부 — [날짜 레일 200 | 머리 · 필터 · 표 | 오른쪽 328]. 레일을 누르면 표가 그 날로 스크롤하고, 표를 스크롤하면 레일이 따라간다.
 * 필터는 표만 거른다(레일 · 요약은 여행 전체). 오른쪽은 요약 카드 — 카테고리 · 정산 카드는 지출 · 정산 대시보드(#18 ⑩)에서 붙인다
 */
export function PcExpenseList({ tripId, list }: PcExpenseListProps) {
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  const pc = usePcList();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const active = filtersActive(pc.filters);
  const sections = active
    ? list.sectionsOf((e) => matchesFilters(e, pc.filters))
    : list.allSections;
  const cells = calendarCells(list.allSections, trip.start_date);
  const scroll = useCalendarScroll(
    cells.map((c) => c.key),
    { scroller: scrollerRef, topKey: "all" },
  );
  const filtered = sections.flatMap((s) => s.expenses);
  const filteredTotal = sumExpenses(filtered, trip.home_currency, trip.exchange_rates);
  return (
    <div className="flex h-[calc(100dvh-var(--shell-top))]">
      <DateRail
        items={cells.map((c, i) => ({ ...c, total: list.allSections[i].total.home }))}
        home={trip.home_currency}
        selected={scroll.selected}
        onSelect={scroll.go}
      />
      <div className="flex min-w-0 flex-1 gap-5 px-6 py-5.5">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex shrink-0 items-center gap-3">
            <h1 className="text-[22px] font-extrabold text-ink-900">가계부</h1>
            <span className="text-sm text-ink-400">{list.count}건</span>
            <span className="flex-1" />
            <Button
              variant="brand"
              size="pill"
              nativeButton={false}
              render={<Link href={`${base}/new`} />}
            >
              + 비용 추가
            </Button>
          </div>
          <FilterBar
            pc={pc}
            categories={CATEGORY_OPTIONS}
            methods={METHOD_OPTIONS}
            payers={list.people.map((p) => ({ value: personKey(p), label: list.displayNameOf(p) }))}
            result={
              active
                ? `${filtered.length}건 · ${formatMoney(filteredTotal.home, trip.home_currency)}`
                : null
            }
          />
          <ExpenseTable
            sections={sections}
            list={list}
            base={base}
            mode={pc.mode}
            onModeChange={pc.setMode}
            rateLine={baseRateLine(
              list.expenses.map((e) => e.currency),
              trip.home_currency,
              trip.exchange_rates,
            )}
            scrollerRef={scrollerRef}
            headRef={scroll.stickyRef}
            sectionRef={scroll.sectionRef}
            keys={cells.map((c) => c.key)}
          />
        </div>
        <aside className="flex w-82 shrink-0 flex-col gap-3 overflow-y-auto">
          <div className="overflow-hidden rounded-[16px] border border-divider">
            <SummaryCard
              total={list.total}
              home={trip.home_currency}
              rates={trip.exchange_rates}
              people={list.solo ? null : list.everyone}
              mySpent={list.mySpent}
              statsHref={`${base}/settlement`}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
