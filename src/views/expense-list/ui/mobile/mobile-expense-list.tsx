"use client";

import Link from "next/link";

import { dayCount } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";

import { periodLabel, periodParam } from "../../lib/period";
import type { ExpenseList } from "../../model/use-expense-list";
import { ExpenseRow } from "./expense-row";
import { PeriodFilter } from "./period-filter";
import { TotalBar } from "./total-bar";

type MobileExpenseListProps = { tripId: string; list: ExpenseList };

/**
 * 모바일 가계부 — 머리(가계부 · 여행 이름 · 정산 「1/N」), 기간 필터, 여행준비 · day N 묶음(묶음 합계 · 줄들 · 「비용 추가」),
 * 하단 탭 위에 합계 바. 묶음의 「비용 추가」 는 그 날짜로 연다
 */
export function MobileExpenseList({ tripId, list }: MobileExpenseListProps) {
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  return (
    <>
      <AppHeader
        title="가계부"
        subtitle={trip.title}
        back="/trips"
        right={
          <Link
            href={`${base}/settlement`}
            aria-label="정산"
            className="text-[15px] font-extrabold tracking-[-0.04em] text-ink-900"
          >
            1/N
          </Link>
        }
      />
      <div className="px-5 pt-1.5 pb-1">
        <PeriodFilter
          value={list.filter}
          onChange={list.setFilter}
          totalDays={dayCount(trip.start_date, trip.end_date)}
          startDate={trip.start_date}
        />
      </div>
      <main className="flex flex-col pb-37.5">
        {list.sections.map((s) => {
          const { label, date } = periodLabel(s.period, trip.start_date);
          return (
            <section key={String(s.period)} className="flex flex-col px-5 pt-6 pb-1">
              <div className="flex items-baseline gap-1.5 pb-1.5">
                <h2 className="text-base font-extrabold text-ink-800">{label}</h2>
                {date && <span className="text-[15px] text-ink-400">{date}</span>}
                <span className="flex-1" />
                {s.total.home > 0 && (
                  <span className="text-[13px] text-ink-400">
                    {formatMoney(s.total.home, trip.home_currency)}
                  </span>
                )}
              </div>
              {s.rows.map((row) => (
                <ExpenseRow
                  key={row.id}
                  row={row}
                  href={`${base}/${row.id}`}
                  onMarkPaid={() => list.markPaid(row.id)}
                />
              ))}
              <Button
                variant="outline"
                size="form"
                className="mt-3.5 w-full"
                nativeButton={false}
                render={<Link href={`${base}/new?day=${periodParam(s.period)}`} />}
              >
                비용 추가
              </Button>
            </section>
          );
        })}
      </main>
      <TotalBar total={list.total} home={trip.home_currency} />
    </>
  );
}
