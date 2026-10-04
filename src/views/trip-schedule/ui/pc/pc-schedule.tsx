"use client";

import { useRef } from "react";

import { ScheduleMap } from "@/entities/schedule-item";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";

import { useScrollFocus } from "../../model/use-scroll-focus";
import { useSplitWidth } from "../../model/use-split-width";
import { DayBody } from "../day-body";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { DayRail } from "./day-rail";
import { SplitHandle } from "./split-handle";
import { SplitPresets } from "./split-presets";

/**
 * 스크롤 강조 기준선 = 목록 칸 높이의 40% 지점(가운데보다 조금 위).
 * PC 는 목록이 길게 보여서, 맨 위보다 눈이 머무는 가운데 근처의 장소를 지도에 보인다.
 * 다만 맨 위에서는 120px 에서 시작해 스크롤한 만큼 내려간다 — 처음부터 40% 면 그 위의 첫 행들은
 * 기준선을 지나지 않은 적이 없어서 강조될 수 없다
 */
const FOCUS_LINE_RATIO = 0.4;
const FOCUS_LINE_TOP = 120;

/**
 * PC 일정 3단 — [날짜 레일 232 | 일정 목록(360~728, 경계선으로 조절) | 지도].
 * PC 헤더 아래 화면 높이를 채우고 칸마다 따로 스크롤한다. 모바일 상단바는 그리지 않는다.
 * 목록을 스크롤하면 기준선을 지난 장소가 지도에 강조된다.
 */
export function PcSchedule({ trip, day, onDayChange, ...body }: ScheduleLayoutProps) {
  const split = useSplitWidth();
  // 지도 폭이 200ms 동안 그대로일 때만 핀을 다시 맞춘다. 키보드 연타 · 창 크기 조절마다 맞추면 지도가 흔들린다
  const fitKey = useDebouncedValue(split.settledWidth, 200);
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const focus = useScrollFocus({
    scroller: listRef,
    list: contentRef,
    line: (scrollTop) => {
      const rect = listRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return rect.top + Math.min(rect.height * FOCUS_LINE_RATIO, scrollTop + FOCUS_LINE_TOP);
    },
    enabled: true,
    resetKey: day,
  });

  return (
    <div className="flex h-[calc(100dvh-var(--shell-top))]">
      {trip && (
        <DayRail
          title={trip.title}
          startDate={trip.start_date}
          endDate={trip.end_date}
          day={day}
          onChange={onDayChange}
        />
      )}
      <div ref={listRef} className="shrink-0 overflow-y-auto" style={{ width: split.width }}>
        {/* 내용 높이를 따라 변하는 감싸개. 끝 여백은 칸 높이의 %라 밖에 둔다 */}
        <div ref={contentRef}>
          <DayBody
            startDate={trip?.start_date ?? null}
            day={day}
            showCounts
            focusId={focus.focusId}
            {...body}
          />
        </div>
        {/* 마지막 장소도 기준선까지 올라오게 하는 여백. 기본 420px, 목록 칸이 높으면 「칸 높이 − 기준선」(60%) 까지 늘린다 */}
        <div aria-hidden="true" className="h-[max(420px,60%)]" />
      </div>
      <SplitHandle
        dragging={split.dragging}
        dragHandlers={split.dragHandlers}
        width={split.width}
        minWidth={split.minWidth}
        maxWidth={split.maxWidth}
        onKeyDown={split.onKeyDown}
        onReset={split.reset}
      />
      <div className="relative min-w-80 flex-1">
        <ScheduleMap
          rows={body.rows}
          focusId={focus.focusId}
          onSelect={(row) => focus.focusOn(row.item.id)}
          pinSize="lg"
          fitKey={fitKey}
        />
        <SplitPresets presets={split.presets} width={split.width} onSelect={split.setWidth} />
      </div>
    </div>
  );
}
