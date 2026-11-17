import Link from "next/link";
import type { ReactNode } from "react";

import type { Trip } from "@/entities/trip";
import { cn } from "@/shared/lib/utils";

import type { TravelogueDay } from "../lib/travelogue";
import { DayDate } from "./day-date";

type DayTocProps = {
  trip: Trip;
  days: readonly TravelogueDay[];
  /** 읽는 날. 목록이면 null */
  current: number | null;
  /** 여행기 주소(검색값 없이) */
  base: string;
  holidayOf: (day: number) => string | null;
};

/**
 * PC 왼쪽 day 목차(220, 붙음) — 맨 위 「한눈에」(목록), 그 아래 날마다 「DAY 1 · 10.31 (토)」 + 제목 · 「4곳」.
 * 읽는 날은 파란 바탕. 아직 안 간 날은 흐리게 · 누를 수 없음. 모바일에는 없다(하루 카드가 그 역할)
 */
export function DayToc({ trip, days, current, base, holidayOf }: DayTocProps) {
  return (
    <nav
      aria-label="날짜 목차"
      className="sticky top-[calc(var(--shell-top)+24px)] hidden w-55 shrink-0 self-start lg:block"
    >
      <p className="truncate px-3 pb-3 text-sm font-extrabold text-ink-900">{trip.title}</p>
      <ul className="flex flex-col gap-0.5">
        <li>
          <Link href={base} className={cn(ITEM, current === null && ACTIVE)}>
            <span className="text-[13px] font-extrabold">한눈에</span>
          </Link>
        </li>
        {days.map((d) => (
          <li key={d.day}>
            <TocItem d={d} active={current === d.day} href={`${base}?day=${d.day + 1}`}>
              <span className="text-[11px] font-bold text-route-card-meta">
                DAY {d.day + 1} ·{" "}
                <DayDate startDate={trip.start_date} day={d.day} holiday={holidayOf(d.day)} />
              </span>
              <span className="truncate text-[13px] font-extrabold">
                {d.title ?? placesText(d.places)}
              </span>
            </TocItem>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const ITEM =
  "flex min-w-0 flex-col gap-0.5 rounded-memo px-3 py-2 text-ink-900 hover:bg-surface-sunken";
const ACTIVE = "bg-route-transit-soft text-brand-text hover:bg-route-transit-soft";

type TocItemProps = { d: TravelogueDay; active: boolean; href: string; children: ReactNode };

/** 목차 한 줄 — 열린 날은 링크, 아직 안 간 날은 흐린 글 */
function TocItem({ d, active, href, children }: TocItemProps) {
  if (!d.open) {
    return (
      <div aria-disabled className={cn(ITEM, "opacity-40 hover:bg-transparent")}>
        {children}
      </div>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(ITEM, active && ACTIVE)}
    >
      {children}
    </Link>
  );
}

/** 제목 없는 날의 목차 글 — 「3곳 다녀옴」 · 「다녀온 곳 없음」 */
function placesText(places: number): string {
  return places > 0 ? `${places}곳 다녀옴` : "다녀온 곳 없음";
}
