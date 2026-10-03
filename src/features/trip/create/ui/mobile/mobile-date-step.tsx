"use client";

import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { MonthGrid } from "@/shared/ui/month-grid";
import { dateCtaLabel } from "../../lib/cta";
import { PAST_MONTHS } from "../../lib/range";
import { useCreateCalendar } from "../../model/use-create-calendar";
import type { TripCreateState } from "../../model/use-trip-create";
import { CreateError } from "../parts/create-error";
import type { TitleComponent } from "../parts/title";
import { Weekdays } from "../parts/weekdays";
import { MobileFooter } from "./mobile-footer";
import { useScrollToThisMonth } from "./use-scroll-to-this-month";

/** 모바일 날짜 단계 (시안 5c). 3년 전~1년 뒤를 세로로 잇고 이번 달로 스크롤해 둔다 */
export function MobileDateStep({
  state,
  Title,
}: {
  state: TripCreateState;
  Title: TitleComponent;
}) {
  const { months, cellsOf } = useCreateCalendar(state.selection);
  const thisMonthRef = useScrollToThisMonth();
  const names = state.picked.map((c) => c.name).join("·");

  return (
    <>
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-divider px-5 pt-1.5 pb-4">
        <IconButton
          label="도시 다시 고르기"
          onClick={state.backToCity}
          disabled={state.locked}
          className="self-start py-2 text-ink-900"
        >
          <X className="size-6" strokeWidth={2} />
        </IconButton>
        <Title className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          여행일정 등록
        </Title>
        <p className="text-[15px] leading-normal text-ink-500">
          {names} · 날짜에 맞춰 날씨와 여행 정보를 알려드려요.
        </p>
      </div>
      <Weekdays className="shrink-0 border-b border-surface-muted bg-[#FAFAFB] py-2.5 text-[13px]" />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFAFB]">
        {months.map(([year, month], i) => (
          <div
            key={`${year}-${month}`}
            ref={i === PAST_MONTHS ? thisMonthRef : undefined}
            className="pt-5 pb-2"
          >
            <h3 className="px-5 pb-2.5 text-base font-bold text-ink-800">
              {year}년 {month}월
            </h3>
            <MonthGrid size="lg" cells={cellsOf(year, month)} onPick={state.pick} />
          </div>
        ))}
      </div>
      <MobileFooter>
        <CreateError state={state} />
        <Button
          size="cta"
          className="w-full"
          disabled={!state.selection?.end || state.create.isPending}
          onClick={state.submit}
        >
          {dateCtaLabel(state.selection, state.create.isPending)}
        </Button>
      </MobileFooter>
    </>
  );
}
