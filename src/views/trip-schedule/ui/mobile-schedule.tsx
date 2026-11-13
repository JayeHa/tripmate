"use client";

import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { ScheduleMap } from "@/entities/schedule-item";
import { MobileScheduleEditor } from "@/features/schedule/edit-mode";
import { useElementHeight } from "@/shared/lib/use-element-height";
import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/shared/ui/app-header";

import { useDayJumps } from "../model/use-day-jumps";
import { useEntryScroll } from "../model/use-entry-scroll";
import { useOpenStop } from "../model/use-open-stop";
import { useVisibleDay } from "../model/use-visible-day";
import { useWindowScrolled } from "../model/use-window-scrolled";
import { MobileFloatingAdd } from "./floating-add/mobile-floating-add";
import { MobileDayBar } from "./mobile-day-bar";
import { RouteDayList } from "./route/route-day-list";
import { RouteMapSheet, type RouteMapTarget } from "./route-map/route-map-sheet";
import type { ScheduleLayoutProps } from "./schedule-layout";
import { ScrollTopButton } from "./scroll-top-button";
import { TripHeader } from "./trip-header";

/** 여행 머리가 이만큼 올라가면 상단바에 작은 제목이 나타난다 */
const TITLE_AFTER = 120;
/** 장소로 옮길 때 날짜 칩 줄 아래로 띄우는 거리 */
const ITEM_SCROLL_GAP = 12;

/**
 * 모바일 일정 — 상단바 아래에 여행 머리(제목 · 날짜 · 일행 · 숙소 칩)가 지나가고, 날짜 칩 · 「계획 | 기록」 이 붙고(sticky) 그 아래 모든 날짜를 노선도로 이어서 그린다.
 * 상단바의 작은 제목은 여행 머리가 올라간 뒤에만 보이고, 오른쪽 「🗺 동선 보기」 는 보고 있는 날의 동선 지도를 연다.
 * 페이지(window)가 스크롤된다. sticky 아래를 지난 날짜가 「보고 있는 날」(칩 · `?day`)이고, 칩을 누르면 그 날짜로 스크롤한다.
 * 역을 누르면 펼친다(화면에 하나). 동선 지도의 「일정에서 보기」 는 그 역을 펼친 채 날짜 칩 줄 아래로 옮긴다
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
  entry,
  onEntryDone,
  startEditAt,
  onOpenStays,
  stayCount,
  onOpenFlights,
  flightCount,
  mode,
  onModeChange,
  ...body
}: ScheduleLayoutProps) {
  const scrolled = useWindowScrolled(TITLE_AFTER);
  const stickyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickyHeight = useElementHeight(stickyRef);
  /** sticky 영역(상단바 + 날짜 칩) 아래 끝의 화면 y */
  const stickyBottom = () => stickyRef.current?.getBoundingClientRect().bottom ?? 0;
  const open = useOpenStop(mode, onModeChange, {
    list: () => listRef.current,
    line: stickyBottom,
    scrollBy: (dy) => window.scrollBy({ top: dy, behavior: "instant" }),
  });
  const [map, setMap] = useState<RouteMapTarget | null>(null);
  /** 그 장소 줄을 날짜 칩 줄 바로 아래로. 칩 줄은 붙은 자리(top + 높이)를 기준으로 잰다 — 맨 위에서 내려갈 때도 옮긴 뒤 위치에 맞게 */
  const scrollToItem = useCallback((id: string, smooth = true) => {
    const row = document.getElementById(`item-${id}`);
    const sticky = stickyRef.current;
    if (!row || !sticky) return;
    const stuck = parseFloat(getComputedStyle(sticky).top) + sticky.offsetHeight;
    const top = row.getBoundingClientRect().top + window.scrollY - stuck - ITEM_SCROLL_GAP;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
  }, []);
  const { scrollToDay } = useVisibleDay({
    list: listRef,
    line: stickyBottom,
    enabled: !edit.editing,
    onChange: onDayChange,
  });
  useDayJumps({ scrollToDay, day, ready: !isPending && !!trip, jump });
  useEntryScroll({
    ready: !isPending && !!trip,
    entry,
    scrollToDay,
    focusOn: scrollToItem,
    onDone: onEntryDone,
  });

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
        right={
          trip && (
            <button
              type="button"
              onClick={() => setMap({ day, focusId: null })}
              data-coach="map"
              className="flex h-9 items-center gap-1.5 rounded-full bg-ink-900 pr-3.5 pl-3 text-[13px] font-extrabold text-white"
            >
              🗺 동선 보기
            </button>
          )
        }
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
      {/* 상단바 아래에 붙는 날짜 칩 · 「계획 | 기록」. 상단바 높이(52px)는 AppHeader 의 h-13 과 같다 */}
      <div
        ref={stickyRef}
        className="sticky top-[calc(var(--shell-top)+3.25rem)] z-10 border-b border-line-card bg-white"
      >
        {trip && (
          <MobileDayBar
            startDate={trip.start_date}
            totalDays={totalDays}
            day={day}
            onDayChange={(d) => scrollToDay(d)}
            holidayOf={body.holidayOf}
            mode={mode}
            onModeChange={open.changeMode}
          />
        )}
      </div>
      <main className="flex flex-1 flex-col bg-surface-sunken">
        {/* 내용 높이를 따라 변하는 감싸개. main 은 flex-1 로 늘어나 내용이 짧으면 크기가 그대로다 */}
        <div ref={listRef} className="flex flex-col">
          <RouteDayList
            trip={trip}
            sections={sections}
            isPending={isPending}
            openId={open.openId}
            onToggle={open.toggle}
            mode={mode}
            onShowMap={(d, id) => setMap({ day: d, focusId: id })}
            {...body}
          />
        </div>
        {/*
          마지막 날 머리도 날짜 칩 아래까지 올라오게 하는 여백. 기본 120px(+ 추가 버튼을 비켜서), 화면이 길면 「화면 높이 − 붙은 칩 줄 아래」 까지 늘린다
        */}
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{
            height: `max(120px, calc(100dvh - var(--shell-top) - 3.25rem - ${stickyHeight}px))`,
          }}
        />
      </main>
      {!edit.editing && (
        // 「+ 추가」(아래 99 · 높이 48) 위로 12
        <ScrollTopButton
          target="window"
          className="fixed right-4 bottom-[calc(159px+env(safe-area-inset-bottom))] z-20"
        />
      )}
      {/* 「+ 추가」 는 계획 모드에서만 */}
      {!edit.editing && mode === "plan" && (
        <MobileFloatingAdd
          onAddPlace={() => body.onAddPlace(day)}
          onStartEdit={startEditAt(day)}
          onAddDayMemo={() => body.onAddDayMemo(day)}
        />
      )}
      {trip && (
        <RouteMapSheet
          target={map}
          onClose={() => setMap(null)}
          startDate={trip.start_date}
          totalDays={totalDays}
          tripId={trip.id}
          rowsOf={(d) => sections[d]?.rows ?? []}
          mode={mode}
          record={body.record}
          onShowInList={(id) => {
            // 펼친 뒤의 자리로 옮긴다 — 위에서 접히는 역이 있으면 그만큼 올라온다
            flushSync(() => open.setOpenId(id));
            scrollToItem(id);
          }}
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
