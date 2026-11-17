import Link from "next/link";

import type { CrewMember } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { cn } from "@/shared/lib/utils";

import type { TravelogueDay } from "../lib/travelogue";
import { DayDate } from "./day-date";
import { EntryRow } from "./entry-row";

type DayReadProps = {
  tripId: string;
  trip: Trip;
  days: readonly TravelogueDay[];
  day: TravelogueDay;
  /** 여행기 주소(검색값 없이) */
  base: string;
  holiday: string | null;
  uploader: (userId: string | null) => CrewMember | null;
  /** 일행이 있는 여행 — 별점 줄에 사람마다 별점 */
  shared: boolean;
};

/**
 * 그날 읽기 — 날짜 머리 → 장소 블록 · 이동(사이 28) → 여행 중 오늘이면 「지금 ○○에 있어요 · 이어서 쓰여요」 → 「‹ 이전 날 · 다음 날 ›」.
 * 다녀온 곳이 없으면 「아직 다녀온 곳이 없어요」
 */
export function DayRead({
  tripId,
  trip,
  days,
  day,
  base,
  holiday,
  uploader,
  shared,
}: DayReadProps) {
  return (
    <article className="flex flex-col bg-white pb-8">
      <DateHead startDate={trip.start_date} day={day} holiday={holiday} />
      <div className="flex flex-col gap-7 pt-6">
        {day.entries.map((e) => (
          <EntryRow key={e.id} tripId={tripId} entry={e} uploader={uploader} shared={shared} />
        ))}
        {day.entries.length === 0 && !day.here && (
          <p className="px-5 text-sm text-route-card-meta">아직 다녀온 곳이 없어요</p>
        )}
        {day.here && (
          <p className="mx-5 rounded-memo bg-visited-soft px-4 py-3 text-sm font-bold text-visited-text">
            📍 지금 {day.here}에 있어요 · 이어서 쓰여요
          </p>
        )}
      </div>
      <DayNav days={days} day={day} base={base} />
    </article>
  );
}

type DateHeadProps = { startDate: string; day: TravelogueDay; holiday: string | null };

/** 날짜 머리 — 큰 숫자 「02」(44/900 파랑) + 「DAY 2」 · 날짜 → 제목 24/800 → 칩(「3곳 다녀옴」 · 「📷 2」 · 「★ 4.3」) → 아래 선 */
function DateHead({ startDate, day, holiday }: DateHeadProps) {
  const chips = [
    `${day.places}곳 다녀옴`,
    day.photos + day.videos > 0 && `📷 ${day.photos + day.videos}`,
    day.average !== null && `★ ${day.average}`,
  ].filter(Boolean);
  return (
    <header className="flex flex-col gap-2.5 border-b border-line-card px-5 pt-6.5 pb-4.5">
      <div className="flex items-end gap-2.5">
        <span className="text-[44px]/none font-black tracking-[-0.03em] text-action">
          {String(day.day + 1).padStart(2, "0")}
        </span>
        <span className="flex flex-col pb-1">
          <span className="text-xs font-extrabold text-action">DAY {day.day + 1}</span>
          <DayDate
            startDate={startDate}
            day={day.day}
            holiday={holiday}
            className="text-[13px] text-route-walk-text"
          />
        </span>
      </div>
      {day.title && (
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-900">{day.title}</h2>
      )}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={String(c)}
            className="rounded-xl bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-700"
          >
            {c}
          </span>
        ))}
      </div>
    </header>
  );
}

type DayNavProps = { days: readonly TravelogueDay[]; day: TravelogueDay; base: string };

/** 맨 아래 「‹ 이전 날」(흰 + 테두리) · 「다음 날 ›」(검정) — 두 줄(회색 라벨 + 「DAY 3 · 제목」). 없거나 아직 안 간 날이면 흐리게 · 누를 수 없음 */
function DayNav({ days, day, base }: DayNavProps) {
  return (
    <nav className="grid grid-cols-2 gap-2.5 px-5 pt-10">
      <NavButton target={days[day.day - 1]} base={base} label="‹ 이전 날" dark={false} />
      <NavButton target={days[day.day + 1]} base={base} label="다음 날 ›" dark />
    </nav>
  );
}

type NavButtonProps = {
  target: TravelogueDay | undefined;
  base: string;
  label: string;
  dark: boolean;
};

/** 이전 · 다음 날 버튼(60 · r12) */
function NavButton({ target, base, label, dark }: NavButtonProps) {
  const className = cn(
    "flex h-15 flex-col justify-center gap-0.5 rounded-xl px-4",
    dark
      ? "items-end bg-ink-900 text-white"
      : "items-start border border-line bg-white text-ink-900",
    !target?.open && "pointer-events-none opacity-35",
  );
  const body = (
    <>
      <span className={cn("text-[11px]", dark ? "text-white/60" : "text-route-card-meta")}>
        {label}
      </span>
      <span className="max-w-full truncate text-[13px] font-extrabold">
        {target ? [`DAY ${target.day + 1}`, target.title].filter(Boolean).join(" · ") : "없음"}
      </span>
    </>
  );
  if (!target?.open)
    return (
      <div aria-disabled className={className}>
        {body}
      </div>
    );
  return (
    <Link href={`${base}?day=${target.day + 1}`} className={className}>
      {body}
    </Link>
  );
}
