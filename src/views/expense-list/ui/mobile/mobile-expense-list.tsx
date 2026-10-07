"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { formatMoney } from "@/shared/lib/money";
import { AppHeader } from "@/shared/ui/app-header";
import { floatingAddClass } from "@/shared/ui/floating-add-button";

import { calendarCells } from "../../lib/calendar";
import { periodLabel } from "../../lib/period";
import { useCalendarScroll } from "../../model/use-calendar-scroll";
import type { ExpenseList, ExpenseListSection } from "../../model/use-expense-list";
import { CalendarStrip } from "./calendar-strip";
import { ExpenseRow } from "./expense-row";
import { ListTabs } from "./list-tabs";
import { SummaryCard } from "./summary-card";

/**
 * 이 화면의 토스트를 더 올리는 높이 — 「+ 비용 추가」(하단 탭 위 16 · 높이 48, 아래에서 99–147)가 토스트 자리(110)와 겹쳐서
 * 버튼 위로 띄운다
 */
export const TOAST_ABOVE_FAB = 48;

type MobileExpenseListProps = { tripId: string; list: ExpenseList };

/**
 * 모바일 가계부 「내역」 — 머리 · 탭(내역 | 지출 · 정산) · 요약 카드 · 여행 날짜 달력 띠(붙음) · 날짜 묶음 · 「+ 비용 추가」.
 * 띠의 칸을 누르면 그 묶음으로 스크롤하고, 스크롤하면 띠가 따라간다. 「+ 비용 추가」 는 띠에서 고른 날로 연다.
 * 「지출 · 정산」 탭은 대시보드 주소(/stats)로 간다
 */
export function MobileExpenseList({ tripId, list }: MobileExpenseListProps) {
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  const statsHref = `${base}/stats`;
  const cells = calendarCells(list.allSections, trip.start_date);
  const scroll = useCalendarScroll(cells.map((c) => c.key));
  return (
    <>
      <AppHeader title="가계부" subtitle={trip.title} back="/trips" />
      <ListTabs active="list" listHref={base} statsHref={statsHref} />
      <SummaryCard
        total={list.total}
        home={trip.home_currency}
        rates={trip.exchange_rates}
        people={list.solo ? null : list.everyone}
        mySpent={list.mySpent}
        statsHref={statsHref}
      />
      <CalendarStrip
        cells={cells}
        selected={scroll.selected}
        onSelect={scroll.go}
        stripRef={scroll.stickyRef}
      />
      <main className="flex flex-col gap-7 pt-4 pb-45">
        {list.allSections.map((s, i) => (
          <DayGroup
            key={cells[i].key}
            sectionRef={scroll.sectionRef(cells[i].key)}
            section={s}
            list={list}
            base={base}
          />
        ))}
      </main>
      <Link
        href={`${base}/new?period=${scroll.selected}`}
        className={`fixed right-4 bottom-[calc(99px+env(safe-area-inset-bottom))] z-20 ${floatingAddClass(false)}`}
      >
        <Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
        <span className="text-[15px] font-extrabold">비용 추가</span>
      </Link>
    </>
  );
}

type DayGroupProps = {
  section: ExpenseListSection;
  list: ExpenseList;
  base: string;
  sectionRef: (el: HTMLElement | null) => void;
};

/** 날짜 묶음 — 머리 「day 2 · 11.1 (일)」 · 합계(13/600 회색), 비용이 없으면 점선 「아직 지출이 없어요」 */
function DayGroup({ section, list, base, sectionRef }: DayGroupProps) {
  const { label, date } = periodLabel(section.period, list.trip.start_date);
  return (
    <section ref={sectionRef} className="flex flex-col">
      <div className="flex items-baseline gap-1.5 px-5 pb-2 text-[13px] font-semibold text-ink-450">
        <h2>{date ? `${label} · ${date.replace("/", " (")})` : label}</h2>
        <span className="flex-1" />
        {section.total.home > 0 && (
          <span>{formatMoney(section.total.home, list.trip.home_currency)}</span>
        )}
      </div>
      {section.rows.length === 0 ? (
        <p className="mx-5 rounded-card border border-dashed border-line p-3.5 text-center text-[13px] text-ink-350">
          아직 지출이 없어요
        </p>
      ) : (
        <div className="divide-y divide-divider border-y border-divider bg-white">
          {section.rows.map((row) => (
            <ExpenseRow
              key={row.id}
              row={row}
              href={`${base}/${row.id}`}
              onMarkPaid={() => list.markPaid(row.id)}
              paying={list.paying === row.id}
              displayNameOf={list.displayNameOf}
              everyone={list.everyone}
            />
          ))}
        </div>
      )}
    </section>
  );
}
