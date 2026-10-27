"use client";

import { useRef } from "react";

import { ScheduleMap } from "@/entities/schedule-item";
import { PcScheduleEditor } from "@/features/schedule/edit-mode";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { useSplitWidth } from "@/shared/lib/use-split-width";
import { cn } from "@/shared/lib/utils";
import { SplitHandle } from "@/shared/ui/split-handle";

import { mapDayOf } from "../../lib/focus";
import { SCHEDULE_SPLIT, splitPresets } from "../../lib/split";
import { useDayJumps } from "../../model/use-day-jumps";
import { useDayViewScroll } from "../../model/use-day-view-scroll";
import { usePcDayView } from "../../model/use-pc-day-view";
import { useScrollFocus } from "../../model/use-scroll-focus";
import { useVisibleDay } from "../../model/use-visible-day";
import { DayList } from "../day-list";
import { PcFloatingAdd } from "../floating-add/pc-floating-add";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { DayPager } from "./day-pager";
import { DayRail } from "./day-rail";
import { DayViewToggle } from "./day-view-toggle";
import { RailTools } from "./rail-tools";
import { SplitPresets } from "./split-presets";

/**
 * 스크롤 강조 기준선 = 목록 칸 높이의 40% 지점(가운데보다 조금 위).
 * PC 는 목록이 길게 보여서, 맨 위보다 눈이 머무는 가운데 근처의 장소를 지도에 보인다.
 * 다만 맨 위에서는 120px 에서 시작해 스크롤한 만큼 내려간다 — 처음부터 40% 면 그 위의 첫 행들은
 * 기준선을 지나지 않은 적이 없어서 강조될 수 없다
 */
const FOCUS_LINE_RATIO = 0.4;
const FOCUS_LINE_TOP = 120;

type PcScheduleProps = ScheduleLayoutProps & {
  /** 「이어서 / 하루씩」 을 바꾼 직후의 안내 — 화면의 토스트로 띄운다 */
  onGuide: (text: string, detail: string) => void;
};

type MapRowsInput = Pick<ScheduleLayoutProps, "edit" | "sections" | "day"> & {
  focusId: string | null;
};

/** 지도에 그릴 줄 — 편집 중이면 편집하는 날, 아니면 강조된 장소의 날(없으면 보고 있는 날) */
function mapRowsOf({ edit, sections, day, focusId }: MapRowsInput) {
  if (edit.editing) return edit.rows;
  return sections[mapDayOf(sections, focusId, day)]?.rows ?? [];
}

/**
 * PC 일정 3단 — [날짜 레일 232 | 일정 목록(360~728, 경계선으로 조절) | 지도].
 * PC 헤더 아래 화면 높이를 채우고 칸마다 따로 스크롤한다. 모바일 상단바는 그리지 않는다.
 * 목록은 모든 날짜를 이어서 그린다. 칸 위를 지난 날짜가 「보고 있는 날」(레일 · `?day`)이고,
 * 레일에서 날짜를 누르면 그 날짜로 스크롤한다. 기준선을 지난 장소가 지도에 강조된다.
 * 레일 제목 아래에서 「하루씩」 으로 바꾸면 고른 날짜만 그리고, 목록 끝에 이전 · 다음 날 버튼을 둔다(끝 여백 없음).
 * 편집은 보기와 상관없이 한 날짜다
 */
export function PcSchedule({
  trip,
  totalDays,
  day,
  onDayChange,
  edit,
  sections,
  isPending,
  jump,
  startEditAt,
  onGuide,
  onOpenStays,
  stayCount,
  onOpenFlights,
  flightCount,
  ...body
}: PcScheduleProps) {
  const split = useSplitWidth(SCHEDULE_SPLIT);
  // 지도 폭이 200ms 동안 그대로일 때만 핀을 다시 맞춘다. 키보드 연타 · 창 크기 조절마다 맞추면 지도가 흔들린다
  const fitKey = useDebouncedValue(split.settledWidth, 200);
  const view = usePcDayView(onGuide);
  const one = view.mode === "one";
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
    enabled: !edit.editing,
    // 하루씩은 날짜마다 목록이 바뀌어 강조를 지운다.
    // 이어서는 모든 날짜가 한 목록이라 날짜가 바뀌어도 강조를 지우지 않는다(지도는 강조된 장소의 날, 강조가 없거나 날짜로 이동해 붙잡아 둔 동안은 보고 있는 날의 핀을 그린다)
    resetKey: one ? day : null,
  });
  const { scrollToDay, holding } = useVisibleDay({
    scroller: listRef,
    list: contentRef,
    line: () => listRef.current?.getBoundingClientRect().top ?? 0,
    enabled: !edit.editing && !one,
    onChange: onDayChange,
  });
  useDayJumps({ scrollToDay, day, ready: !isPending && !!trip, jump, enabled: !one });
  useDayViewScroll({ one, day, list: listRef, scrollToDay });

  /** 레일 · 목록 끝에서 날짜를 골랐다 — 편집 중이면 편집할 날, 하루씩이면 그 날을 그리고, 이어서면 그 날로 스크롤 */
  function pickDay(d: number) {
    if (edit.editing) edit.setDay(d);
    else if (one) onDayChange(d);
    else scrollToDay(d);
  }

  return (
    <div className="flex h-[calc(100dvh-var(--shell-top))]">
      {trip && (
        <DayRail
          title={trip.title}
          startDate={trip.start_date}
          endDate={trip.end_date}
          // 편집 중에는 레일도 편집할 날을 고른다
          day={edit.editing ? edit.day : day}
          onChange={pickDay}
          summaries={trip.day_summaries}
          holidayOf={body.holidayOf}
          footer={
            <RailTools
              stayCount={stayCount}
              onOpenStays={onOpenStays}
              flightCount={flightCount}
              onOpenFlights={onOpenFlights}
            />
          }
        >
          <DayViewToggle
            mode={view.mode}
            onChange={view.setMode}
            tip={view.tip}
            onTipDismiss={view.dismissTip}
          />
        </DayRail>
      )}
      {trip && edit.editing && (
        <div className="shrink-0 overflow-y-auto" style={{ width: split.width }}>
          <PcScheduleEditor edit={edit} startDate={trip.start_date} totalDays={totalDays} />
        </div>
      )}
      {/*
        편집하는 동안은 숨기기만 한다 — 스크롤 강조가 잡은 목록 칸을 그대로 두려고.
        바깥 감싸개는 스크롤하지 않아 「+ 추가」 를 목록 칸 오른쪽 아래에 고정한다
      */}
      <div
        className={cn("relative shrink-0", edit.editing && "hidden")}
        style={{ width: split.width }}
      >
        <div ref={listRef} className="h-full overflow-y-auto">
          {/* 내용 높이를 따라 변하는 감싸개. 끝 여백은 칸 높이의 %라 밖에 둔다 */}
          <div ref={contentRef}>
            <DayList
              trip={trip}
              sections={one ? sections.slice(day, day + 1) : sections}
              isPending={isPending}
              startEditAt={startEditAt}
              showCounts
              focusId={focus.focusId}
              {...body}
            />
          </div>
          {one ? (
            <DayPager day={day} totalDays={totalDays} onChange={pickDay} />
          ) : (
            // 마지막 장소도 기준선까지 올라오게 하는 여백. 기본 420px, 목록 칸이 높으면 「칸 높이 − 기준선」(60%) 까지 늘린다
            <div aria-hidden="true" className="h-[max(420px,60%)]" />
          )}
        </div>
        <PcFloatingAdd
          onAddPlace={() => body.onAddPlace(day)}
          onStartEdit={startEditAt(day)}
          onAddDayMemo={() => body.onAddDayMemo(day)}
        />
      </div>
      <SplitHandle
        label="일정 목록 너비 (←/→ 로 조절, Enter 는 기본 너비)"
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
          rows={mapRowsOf({ edit, sections, day, focusId: holding ? null : focus.focusId })}
          focusId={edit.editing ? null : focus.focusId}
          onSelect={edit.editing ? undefined : (row) => focus.focusOn(row.item.id)}
          pinSize="lg"
          fitKey={fitKey}
        />
        <SplitPresets
          presets={splitPresets(split.viewport)}
          width={split.width}
          onSelect={split.setWidth}
        />
      </div>
    </div>
  );
}
