"use client";

import { useRef, useState } from "react";

import { ScheduleMap, type TimelineRow } from "@/entities/schedule-item";

import { useSplitWidth } from "../../model/use-split-width";
import { DayBody } from "../day-body";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { DayRail } from "./day-rail";
import { SplitHandle } from "./split-handle";
import { SplitPresets } from "./split-presets";

/**
 * PC 일정 3단 — [날짜 레일 232 | 일정 목록(360~728, 경계선으로 조절) | 지도].
 * PC 헤더 아래 화면 높이를 채우고 칸마다 따로 스크롤한다. 모바일 상단바는 그리지 않는다.
 */
export function PcSchedule({ trip, day, onDayChange, ...body }: ScheduleLayoutProps) {
  const split = useSplitWidth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /** 지도 핀을 누르면 목록 칸을 그 카드가 위에 오도록 스크롤한다 */
  function selectPin(row: TimelineRow) {
    setSelectedId(row.item.id);
    const list = listRef.current;
    const card = document.getElementById(`item-${row.item.id}`);
    if (!list || !card) return;
    const top =
      card.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop - 12;
    list.scrollTo({ top, behavior: "smooth" });
  }

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
        <DayBody startDate={trip?.start_date ?? null} day={day} showCounts {...body} />
      </div>
      <SplitHandle
        dragging={split.dragging}
        dragHandlers={split.dragHandlers}
        onReset={split.reset}
      />
      <div className="relative min-w-80 flex-1">
        <ScheduleMap rows={body.rows} selectedId={selectedId} onSelect={selectPin} pinSize="lg" />
        <SplitPresets presets={split.presets} width={split.width} onSelect={split.setWidth} />
      </div>
    </div>
  );
}
