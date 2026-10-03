"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/shared/ui/icon-button";
import { MonthGrid } from "@/shared/ui/month-grid";

import { PAST_MONTHS } from "../../lib/range";
import { useCreateCalendar } from "../../model/use-create-calendar";
import type { TripCreateState } from "../../model/use-trip-create";
import { Weekdays } from "../parts/weekdays";

const NAV_BUTTON = "size-8 rounded-full border border-line text-ink-700 disabled:opacity-35";

type PcDateStepProps = { state: TripCreateState };

/** PC 날짜 단계 본문 (시안 6c). 두 달 나란히, ◀▶ 로 넘기고 처음엔 이번 달부터 */
export function PcDateStep({ state }: PcDateStepProps) {
  const { months, cellsOf } = useCreateCalendar(state.selection);
  const [offset, setOffset] = useState(PAST_MONTHS);
  const last = months.length - 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-7 pt-1">
      <div className="flex shrink-0 items-center gap-4 pb-2.5 text-xs text-ink-400">
        <Legend />
        <IconButton
          label="이전 달"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className={`ml-auto ${NAV_BUTTON}`}
        >
          <ChevronLeft className="size-4.5" />
        </IconButton>
        <IconButton
          label="다음 달"
          onClick={() => setOffset((o) => Math.min(last, o + 1))}
          disabled={offset === last}
          className={NAV_BUTTON}
        >
          <ChevronRight className="size-4.5" />
        </IconButton>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-8 overflow-y-auto">
        {months.slice(offset, offset + 2).map(([year, month]) => (
          <div key={`${year}-${month}`} className="flex flex-col gap-1.5">
            <h3 className="pb-1 text-center text-base font-extrabold text-ink-900">
              {year}년 {month}월
            </h3>
            <Weekdays className="pb-1.5 text-xs" />
            <MonthGrid size="md" cells={cellsOf(year, month)} onPick={state.pick} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded-full bg-primary" />
        출발 · 도착
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-5.5 rounded-[5px] bg-[#EEEFF1]" />
        다른 일정
      </span>
    </>
  );
}
