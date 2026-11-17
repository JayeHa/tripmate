import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import type { Trip } from "@/entities/trip";
import { NAV } from "@/shared/lib/nav-transition";

import type { TravelogueDay } from "../lib/travelogue";
import { DayDate } from "./day-date";

type TopBarProps = {
  tripId: string;
  trip: Trip;
  /** 그날 읽기면 그 날, 목록이면 null */
  day: TravelogueDay | null;
  /** 여행기 주소(검색값 없이) */
  base: string;
  holiday: string | null;
};

/**
 * 위 막대(52, 흰 바탕 · 붙음) — ‹ · 「여행기」. 그날 읽기면 「DAY 2 · 러닝 & 신주쿠」 + 아래 날짜(12 회색).
 * ‹ 는 목록에서 일정으로, 그날 읽기에서 목록으로(검색값만 바뀌어 전환 없이). 「↗ 공유」 는 공유를 만들 때 단다
 */
export function TopBar({ tripId, trip, day, base, holiday }: TopBarProps) {
  const title = day ? [`DAY ${day.day + 1}`, day.title].filter(Boolean).join(" · ") : "여행기";
  return (
    <header className="sticky top-(--shell-top) z-20 flex h-13 items-center gap-2 border-b border-line-card bg-white px-2 lg:px-0">
      {day ? (
        <Link
          href={base}
          aria-label="목록으로"
          className="flex size-10 items-center justify-center text-ink-900"
        >
          <ChevronLeft className="size-6" strokeWidth={2.2} />
        </Link>
      ) : (
        <Link
          href={`/trips/${tripId}/schedule`}
          transitionTypes={NAV.back}
          aria-label="일정으로"
          className="flex size-10 items-center justify-center text-ink-900"
        >
          <ChevronLeft className="size-6" strokeWidth={2.2} />
        </Link>
      )}
      <div className="flex min-w-0 flex-col">
        <h1 className="truncate text-base font-extrabold text-ink-900">{title}</h1>
        {day && (
          <DayDate
            startDate={trip.start_date}
            day={day.day}
            holiday={holiday}
            className="truncate text-xs text-route-card-meta"
          />
        )}
      </div>
    </header>
  );
}
