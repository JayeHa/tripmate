"use client";

import { useRef, useState } from "react";

import { ScheduleMap } from "@/entities/schedule-item";
import { DayChips } from "@/features/schedule/day-selector";
import { MobileScheduleEditor } from "@/features/schedule/edit-mode";
import { useElementHeight } from "@/shared/lib/use-element-height";
import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/shared/ui/app-header";

import { mapDayOf } from "../lib/focus";
import { useDayJumps } from "../model/use-day-jumps";
import { useScrollFocus } from "../model/use-scroll-focus";
import { useVisibleDay } from "../model/use-visible-day";
import { useWindowScrolled } from "../model/use-window-scrolled";
import { DayList } from "./day-list";
import { MobileFloatingAdd } from "./floating-add/mobile-floating-add";
import { MapPanel } from "./map-panel";
import type { ScheduleLayoutProps } from "./schedule-layout";
import { TripHeader } from "./trip-header";

/**
 * 스크롤 강조 기준선 = sticky 영역(상단바 + 지도 + 날짜 칩) 아래로 이만큼.
 * 목록 맨 위에 온 장소가 강조되되, 핀으로 고르면 sticky 아래 36px(48 − 12)에 놓여 지도에 붙어 보이지 않는다
 */
const FOCUS_LINE_OFFSET = 48;
/** 여행 머리가 이만큼 올라가면 상단바에 작은 제목이 나타난다 */
const TITLE_AFTER = 120;

/**
 * 모바일 일정 — 상단바 아래에 여행 머리(제목 · 날짜 · 일행 · 숙소 칩)가 지나가고, [접히는 지도 + 날짜 칩] 이 붙고(sticky) 그 아래 모든 날짜를 이어서 그린다.
 * 상단바의 작은 제목은 여행 머리가 올라간 뒤에만 보인다.
 * 페이지(window)가 스크롤된다. sticky 아래를 지난 날짜가 「보고 있는 날」(칩 · `?day`)이고,
 * 칩을 누르면 그 날짜로 스크롤한다. 기준선을 지난 장소가 지도에 강조된다(지도가 펼쳐져 있을 때만).
 */
export function MobileSchedule({
  trip,
  totalDays,
  day,
  onDayChange,
  edit,
  sections,
  isPending,
  jump,
  startEditAt,
  onOpenStays,
  stayCount,
  onOpenFlights,
  flightCount,
  ...body
}: ScheduleLayoutProps) {
  const [mapOpen, setMapOpen] = useState(true);
  const scrolled = useWindowScrolled(TITLE_AFTER);
  const stickyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickyHeight = useElementHeight(stickyRef);
  /** sticky 영역(상단바 + 지도 + 칩) 아래 끝의 화면 y */
  const stickyBottom = () => stickyRef.current?.getBoundingClientRect().bottom ?? 0;
  // 모든 날짜가 한 목록이라 날짜가 바뀌어도 강조를 지우지 않는다(지도는 강조된 장소의 날, 강조가 없거나 날짜로 이동해 붙잡아 둔 동안은 보고 있는 날의 핀을 그린다)
  const focus = useScrollFocus({
    list: listRef,
    line: () => stickyBottom() + FOCUS_LINE_OFFSET,
    enabled: mapOpen,
    resetKey: null,
  });
  const { scrollToDay, holding } = useVisibleDay({
    list: listRef,
    line: stickyBottom,
    enabled: !edit.editing,
    onChange: onDayChange,
  });
  useDayJumps({ scrollToDay, day, ready: !isPending && !!trip, jump });

  return (
    <>
      <AppHeader
        title={
          <span
            className={cn(
              "transition-opacity duration-200",
              scrolled ? "opacity-100" : "opacity-0",
            )}
          >
            {trip?.title ?? "일정"}
          </span>
        }
        back="/trips"
      />
      {trip && (
        <TripHeader
          trip={trip}
          stayCount={stayCount}
          onOpenStays={onOpenStays}
          flightCount={flightCount}
          onOpenFlights={onOpenFlights}
        />
      )}
      {/* 상단바 아래에 붙는 지도 + 날짜 칩. 상단바 높이(52px)는 AppHeader 의 h-13 과 같다 */}
      <div ref={stickyRef} className="sticky top-[calc(var(--shell-top)+3.25rem)] z-10 bg-white">
        <MapPanel open={mapOpen} onToggle={() => setMapOpen((o) => !o)}>
          <ScheduleMap
            rows={sections[mapDayOf(sections, holding ? null : focus.focusId, day)]?.rows ?? []}
            focusId={focus.focusId}
            onSelect={(row) => focus.focusOn(row.item.id)}
          />
        </MapPanel>
        {trip && (
          <DayChips
            startDate={trip.start_date}
            totalDays={totalDays}
            value={day}
            onChange={(d) => scrollToDay(d)}
            holidayOf={body.holidayOf}
          />
        )}
      </div>
      <main className="flex flex-1 flex-col">
        {/* 내용 높이를 따라 변하는 감싸개. main 은 flex-1 로 늘어나 내용이 짧으면 크기가 그대로다 */}
        <div ref={listRef} className="flex flex-col">
          <DayList
            trip={trip}
            sections={sections}
            isPending={isPending}
            startEditAt={startEditAt}
            focusId={focus.focusId}
            {...body}
          />
        </div>
        {/*
          마지막 장소도 기준선까지 올라오게 하는 여백. 기본 340px, 화면이 길면 「화면 높이 − 기준선」 까지 늘린다.
          기준선 = 상단바(3.25rem) + sticky 영역 + FOCUS_LINE_OFFSET. sticky 높이는 지도를 접고 펼 때 바뀌어 재서 쓴다
        */}
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{
            height: `max(340px, calc(100dvh - var(--shell-top) - 3.25rem - ${stickyHeight + FOCUS_LINE_OFFSET}px))`,
          }}
        />
      </main>
      {!edit.editing && (
        <MobileFloatingAdd
          onAddPlace={() => body.onAddPlace(day)}
          onStartEdit={startEditAt(day)}
          onAddDayMemo={() => body.onAddDayMemo(day)}
        />
      )}
      {/* 편집은 화면 전체를 덮는다. 아래 일정 화면은 그대로 두어 닫으면 보던 자리로 돌아온다 */}
      {trip && edit.editing && (
        <MobileScheduleEditor
          edit={edit}
          startDate={trip.start_date}
          totalDays={totalDays}
          map={<ScheduleMap rows={edit.rows} />}
        />
      )}
    </>
  );
}
