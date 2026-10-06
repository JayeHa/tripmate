"use client";

import Link from "next/link";

import { dayCount } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/ui/filter-chip";

import { periodLabel, periodParam } from "../../lib/period";
import type { ExpenseList } from "../../model/use-expense-list";
import { TABLE_COLUMNS } from "./columns";
import { ExpenseTableRow } from "./expense-table-row";
import { SummaryPanel } from "./summary-panel";

type PcExpenseListProps = { tripId: string; list: ExpenseList };

/**
 * PC 가계부 — 왼쪽 표(머리 · 기간 칩 · 열 머리 · 여행준비 · day N 묶음과 묶음 합계 줄), 오른쪽 합계 칸(380).
 * 줄을 누르면 그 지출을 연다. 지출이 없는 날은 「아직 비용이 없어요」
 */
export function PcExpenseList({ tripId, list }: PcExpenseListProps) {
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  const periods = [
    "all",
    "prep",
    ...Array.from({ length: dayCount(trip.start_date, trip.end_date) }, (_, i) => i),
  ] as const;
  return (
    <div className="flex h-[calc(100dvh-var(--shell-top))]">
      <div className="flex min-w-0 flex-1 flex-col border-r border-divider">
        <div className="flex shrink-0 flex-col gap-4 px-8 pt-6 pb-3.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-900">가계부</h1>
            <span className="text-[15px] text-ink-400">{list.count}건</span>
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
          <div className="flex flex-wrap items-center gap-1.5">
            {periods.map((p) => {
              const text =
                p === "all" ? { label: "전체", date: "" } : periodLabel(p, trip.start_date);
              return (
                <FilterChip
                  key={String(p)}
                  size="sm"
                  className="h-8"
                  selected={list.filter === p}
                  onClick={() => list.setFilter(p)}
                >
                  {text.label}
                  {text.date && <span className="font-medium opacity-75">{text.date}</span>}
                </FilterChip>
              );
            })}
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 border-y border-surface-muted bg-surface-sunken px-8 py-2.5 text-xs font-bold text-ink-400",
            TABLE_COLUMNS,
          )}
        >
          <span>카테고리</span>
          <span>항목</span>
          <span>결제</span>
          <span>함께</span>
          <span className="text-right">금액</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          {list.sections.map((s) => {
            const { label, date } = periodLabel(s.period, trip.start_date);
            return (
              <section key={String(s.period)} className="px-8">
                <div className="flex items-center gap-1.5 pt-5 pb-2">
                  <h2 className="text-[15px] font-extrabold text-ink-800">{label}</h2>
                  {date && <span className="text-sm text-ink-400">{date}</span>}
                </div>
                {s.rows.map((row) => (
                  <ExpenseTableRow
                    key={row.id}
                    row={row}
                    href={`${base}/${row.id}`}
                    onMarkPaid={() => list.markPaid(row.id)}
                    paying={list.paying === row.id}
                    avatarOf={list.avatarOf}
                  />
                ))}
                {s.rows.length === 0 ? (
                  <div className="flex items-center justify-between border-b border-surface-muted py-3.5">
                    <span className="text-[13px] text-ink-350">아직 비용이 없어요</span>
                    <Link
                      href={`${base}/new?period=${periodParam(s.period)}`}
                      className="text-[13px] font-bold text-primary"
                    >
                      + 비용 추가
                    </Link>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "items-center border-b border-line bg-[#FAFBFC] py-3",
                      TABLE_COLUMNS,
                    )}
                  >
                    <span className="col-span-2 pl-9.5 text-[13px] font-bold text-ink-500">
                      {label} 합계
                    </span>
                    <span />
                    <span />
                    <span className="text-right text-[15px] font-extrabold text-ink-900">
                      {formatMoney(s.total.home, trip.home_currency)}
                    </span>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <SummaryPanel total={list.total} home={trip.home_currency} />
    </div>
  );
}
