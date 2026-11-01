"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { personKey } from "@/entities/expense";
import { todayISO } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/shared/ui/app-header";
import { buttonVariants } from "@/shared/ui/button";
import { floatingAddClass } from "@/shared/ui/floating-add-button";

import { calendarCells } from "../../lib/calendar";
import { byPayer } from "../../lib/filters";
import { newPeriod } from "../../lib/new-period";
import { periodLabel } from "../../lib/period";
import { useCalendarScroll } from "../../model/use-calendar-scroll";
import type { ExpenseList, ExpenseListSection } from "../../model/use-expense-list";
import { useScrolledPast } from "../../model/use-scrolled-past";
import { CalendarStrip } from "./calendar-strip";
import { ExpenseRow } from "./expense-row";
import { ListTabs } from "./list-tabs";
import { PayerChips } from "./payer-chips";
import { SummaryCard } from "./summary-card";

/**
 * 이 화면의 토스트를 더 올리는 높이 — 「+ 비용 추가」(하단 탭 위 16 · 높이 48, 아래에서 99–147)가 토스트 자리(110)와 겹쳐서
 * 버튼 위로 띄운다
 */
export const TOAST_ABOVE_FAB = 48;

type MobileExpenseListProps = { tripId: string; list: ExpenseList };

/**
 * 모바일 가계부 「내역」 — 머리 · 탭(내역 | 지출 · 정산) · 요약 카드 + 「+ 비용 추가」(52) · 날짜 묶음.
 * 「+ 비용 추가」 가 위로 사라지면 날짜 이동 줄과 플로팅 「+ 비용 추가」 가 나타난다(목록은 밀리지 않는다).
 * 줄의 칸을 누르면 그 묶음으로 스크롤하고, 스크롤하면 줄이 따라간다. 「+ 비용 추가」 는 줄에서 고른 날(맨 위에서는 오늘)로 연다.
 * 「지출 · 정산」 탭은 대시보드 주소(/stats)로 간다.
 * 일행이 있으면 목록 위 「결제한 사람」 칩으로 그 사람이 낸 비용만 본다 — 날짜 합계 · 날짜 줄도 따라가고, 맨 위 총 지출은 그대로.
 * 고른 사람은 이 화면에서만 기억한다
 */
export function MobileExpenseList({ tripId, list }: MobileExpenseListProps) {
  const { trip } = list;
  const base = `/trips/${tripId}/expenses`;
  const statsHref = `${base}/stats`;
  const [picked, setPicked] = useState<string | null>(null);
  // 고른 사람이 여행에서 빠졌으면(정산 인원 지움) 전체로
  const payer = list.people.some((p) => personKey(p) === picked) ? picked : null;
  const sections = payer === null ? list.allSections : list.sectionsOf(byPayer(payer));
  const cells = calendarCells(sections, trip.start_date, list.holidays);
  const scroll = useCalendarScroll(cells.map((c) => c.key));
  const cta = useRef<HTMLAnchorElement>(null);
  const past = useScrolledPast(cta, scroll.stickyRef);
  const period = newPeriod(scroll.selected, past, trip.start_date, trip.end_date, todayISO());
  const newHref = period === null ? `${base}/new` : `${base}/new?period=${period}`;
  return (
    <>
      <AppHeader title="가계부" subtitle={trip.title} back="/trips" />
      <ListTabs
        active="list"
        listHref={base}
        statsHref={statsHref}
        refundHref={`${base}/refunds`}
      />
      <SummaryCard
        total={list.total}
        home={trip.home_currency}
        rates={trip.exchange_rates}
        people={list.solo ? null : list.everyone}
        myPaid={list.myPaid}
        statsHref={statsHref}
      >
        <Link
          ref={cta}
          href={newHref}
          transitionTypes={NAV.forward}
          // cn 으로 감싼다 — buttonVariants 는 클래스를 병합하지 않아 기본 text-sm · font-medium 이 CTA 크기(16/700)를 이긴다
          className={cn(buttonVariants({ variant: "brand", size: "cta" }), "mt-1")}
        >
          <Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
          비용 추가
        </Link>
      </SummaryCard>
      <CalendarStrip
        cells={cells}
        selected={scroll.selected}
        onSelect={scroll.go}
        stripRef={scroll.stickyRef}
        shown={past}
      />
      <div aria-hidden="true" className="h-2 bg-surface-sunken" />
      <main className="flex flex-col gap-7 pt-4 pb-45">
        {!list.solo && <PayerChips list={list} value={payer} onChange={setPicked} />}
        {sections.map((s, i) => (
          <DayGroup
            key={cells[i].key}
            sectionRef={scroll.sectionRef(cells[i].key)}
            section={s}
            list={list}
            base={base}
            filtered={payer !== null}
          />
        ))}
      </main>
      {/* 위의 「+ 비용 추가」 가 보이는 동안은 숨긴다 — 같은 버튼이 둘 보이지 않게 */}
      <Link
        href={newHref}
        transitionTypes={NAV.forward}
        aria-hidden={!past}
        tabIndex={past ? undefined : -1}
        className={cn(
          "fixed right-4 bottom-[calc(99px+env(safe-area-inset-bottom))] z-20 transition-opacity duration-200",
          floatingAddClass(false),
          !past && "pointer-events-none opacity-0",
        )}
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
  /** 결제한 사람으로 거른 중 — 빈 날 문구가 바뀐다 */
  filtered: boolean;
};

/** 날짜 묶음 — 머리 「day 2 · 11.1 (일)」 · 합계(13/600 회색), 비용이 없으면 점선 「아직 지출이 없어요」(거른 중이면 「결제한 지출이 없어요」) */
function DayGroup({ section, list, base, sectionRef, filtered }: DayGroupProps) {
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
          {filtered ? "결제한 지출이 없어요" : "아직 지출이 없어요"}
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
              avatarOf={list.avatarOf}
              everyone={list.everyone}
            />
          ))}
        </div>
      )}
    </section>
  );
}
