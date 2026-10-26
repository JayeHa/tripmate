import Link from "next/link";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

import { ddayChipLabel, homeRangeLabel } from "../lib/home-header";

type Size = "mobile" | "pc";

/** 모바일 칩 24 · 12/800, PC 칩 26 · 13/800 */
const CHIP: Record<Size, string> = {
  mobile: "h-6 px-2.25 text-xs",
  pc: "h-6.5 px-2.5 text-[13px]",
};

type DdayChipProps = { trip: Trip; size: Size };

/** 여행 시점 칩 — 옅은 파랑 바탕에 「D-28」 · 「여행 2일째」 · 「여행 끝」 */
export function DdayChip({ trip, size }: DdayChipProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center rounded-full bg-brand-soft font-extrabold whitespace-nowrap text-brand-text",
        CHIP[size],
      )}
    >
      {ddayChipLabel(trip.start_date, trip.end_date, todayISO())}
    </span>
  );
}

/** 모바일 / PC 값 — 여행 이름 24 · 30, 기간 13 · 14, 「편집」 14 · 15 */
const STYLE: Record<Size, { root: string; col: string; title: string; row: string; edit: string }> =
  {
    mobile: {
      root: "gap-3",
      col: "gap-1.5",
      title: "text-2xl/tight",
      row: "gap-2 text-[13px]",
      edit: "pb-0.5 text-sm",
    },
    pc: {
      root: "gap-6",
      col: "gap-2",
      title: "text-3xl/tight",
      row: "gap-2.5 text-sm",
      edit: "pb-1 text-[15px] hover:text-ink-900",
    },
  };

type HomeTitleProps = { tripId: string; trip: Trip; size: Size; className?: string };

/**
 * 홈 머리의 여행 이름 줄 — 왼쪽 여행 이름 · D-day 칩 · 기간, 오른쪽 아래 「편집」.
 * 「편집」 은 여행 편집 메뉴가 생기기 전까지 설정 화면(제목 · 날짜 · 일행 초대)으로 보낸다
 */
export function HomeTitle({ tripId, trip, size, className }: HomeTitleProps) {
  const s = STYLE[size];
  return (
    <div className={cn("flex items-end", s.root, className)}>
      <div className={cn("flex min-w-0 flex-1 flex-col", s.col)}>
        <h1 className={cn("truncate font-extrabold tracking-[-0.02em] text-ink-900", s.title)}>
          {trip.title}
        </h1>
        <div className={cn("flex items-center", s.row)}>
          <DdayChip trip={trip} size={size} />
          <span className="truncate text-ink-400">
            {homeRangeLabel(trip.start_date, trip.end_date)}
          </span>
        </div>
      </div>
      <Link
        href={`/trips/${tripId}/settings`}
        transitionTypes={NAV.tab}
        className={cn("shrink-0 font-semibold whitespace-nowrap text-ink-500", s.edit)}
      >
        편집
      </Link>
    </div>
  );
}
