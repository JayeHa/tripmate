"use client";

import { useRef, useState } from "react";

import { ScheduleMap, type TimelineRow } from "@/entities/schedule-item";
import { DayChips } from "@/features/schedule/day-selector";
import { AppHeader } from "@/shared/ui/app-header";

import { DayBody } from "./day-body";
import { MapPanel } from "./map-panel";
import type { ScheduleLayoutProps } from "./schedule-layout";

/**
 * 모바일 일정 — 상단바 아래에 [접히는 지도 + 날짜 칩] 이 붙고(sticky) 그 아래 하루치 본문.
 * 페이지(window)가 스크롤된다.
 */
export function MobileSchedule({
  trip,
  totalDays,
  day,
  onDayChange,
  ...body
}: ScheduleLayoutProps) {
  const [mapOpen, setMapOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  /**
   * 지도 핀을 누르면 그 카드를 sticky 영역(상단바 + 지도 + 날짜 칩) 바로 아래로 스크롤한다.
   * scrollIntoView 는 sticky 를 모르고 창 가운데에 맞춰, 작은 폰에서는 카드가 지도 밑에 가려진다.
   * sticky 높이는 지도를 접으면 바뀌므로 누를 때마다 잰다.
   */
  function selectPin(row: TimelineRow) {
    setSelectedId(row.item.id);
    const card = document.getElementById(`item-${row.item.id}`);
    const stickyBottom = stickyRef.current?.getBoundingClientRect().bottom ?? 0;
    if (!card) return;
    const top = card.getBoundingClientRect().top + window.scrollY - stickyBottom - 12;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <>
      <AppHeader title={trip?.title ?? "일정"} back="/trips" />
      {/* 상단바 아래에 붙는 지도 + 날짜 칩. 상단바 높이(52px)는 AppHeader 의 h-13 과 같다 */}
      <div ref={stickyRef} className="sticky top-[calc(var(--shell-top)+3.25rem)] z-10 bg-white">
        <MapPanel open={mapOpen} onToggle={() => setMapOpen((o) => !o)}>
          <ScheduleMap rows={body.rows} selectedId={selectedId} onSelect={selectPin} />
        </MapPanel>
        {trip && (
          <DayChips
            startDate={trip.start_date}
            totalDays={totalDays}
            value={day}
            onChange={onDayChange}
          />
        )}
      </div>
      <main className="flex flex-1 flex-col">
        <DayBody startDate={trip?.start_date ?? null} day={day} {...body} />
      </main>
    </>
  );
}
