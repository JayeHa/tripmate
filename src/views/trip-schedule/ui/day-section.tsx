"use client";

import {
  type MemoAuthor,
  Timeline,
  type TimelineRow,
  useOpenMemos,
} from "@/entities/schedule-item";
import { Button } from "@/shared/ui/button";

import { DayHeader } from "./day-header";

type DaySectionProps = {
  startDate: string;
  day: number;
  /** 그날 하루 요약 */
  summary?: string | null;
  /** 그날의 여행지 공휴일 이름 */
  holiday?: string | null;
  rows: TimelineRow[];
  /** PC 는 day 헤더 아래에 「메모 N개 · 장소 N곳」 을 함께 보인다 */
  showCounts?: boolean;
  /** 지도에 강조된 장소. 그 행에 배경을 깐다 */
  focusId?: string | null;
  onOpen: (row: TimelineRow) => void;
  onEditMove?: (row: TimelineRow) => void;
  onAddPlace: (day: number) => void;
  onAddDayMemo: (day: number) => void;
  authorOf: (authorId: string | null) => MemoAuthor | null;
  /** 카드의 「체크리스트 N」 칩 */
  checklistOf?: (row: TimelineRow) => { count: number; href: string };
  voucherOf?: (row: TimelineRow) => { count: number; onOpen: () => void };
  /** 그날로 편집을 여는 동작. 일정 · 여행을 읽는 동안은 없다 — 「편집」 을 그리지 않는다 */
  onStartEdit?: () => void;
};

/**
 * 하루 한 묶음 — day 헤더 · 타임라인(없으면 한 줄 안내) · 「일정 추가 | 메모 추가」. 이어서 보기에서 날마다 하나씩 그린다.
 * `data-day-section` 으로 보고 있는 날을 고른다. 메모 펼침은 날짜마다 따로(「메모 모두 펼치기」 도 그날만)
 */
export function DaySection({
  startDate,
  day,
  summary,
  holiday,
  rows,
  showCounts,
  focusId,
  onOpen,
  onEditMove,
  onAddPlace,
  onAddDayMemo,
  authorOf,
  checklistOf,
  voucherOf,
  onStartEdit,
}: DaySectionProps) {
  const memos = useOpenMemos(rows);
  return (
    <section data-day-section={day} aria-label={`day ${day + 1}`} className="flex flex-col">
      <DayHeader
        startDate={startDate}
        day={day}
        hasMemos={memos.hasMemos}
        allOpen={memos.allOpen}
        onToggleAll={memos.toggleAll}
        counts={showCounts ? countsOf(rows) : undefined}
        summary={summary}
        holiday={holiday}
        onEdit={onStartEdit}
      />
      {rows.length === 0 && (
        <p className="px-5 pt-1 pb-3 text-[13px] text-ink-350">아직 일정이 없어요</p>
      )}
      <Timeline
        rows={rows}
        openIds={memos.openIds}
        onToggleMemo={memos.toggle}
        onOpen={onOpen}
        onEditMove={onEditMove}
        focusId={focusId}
        authorOf={authorOf}
        checklistOf={checklistOf}
        voucherOf={voucherOf}
      />
      <div className="flex gap-2.5 px-5 pt-1 pb-8">
        <Button variant="outline" size="form" className="flex-1" onClick={() => onAddPlace(day)}>
          일정 추가
        </Button>
        <Button variant="outline" size="form" className="flex-1" onClick={() => onAddDayMemo(day)}>
          메모 추가
        </Button>
      </div>
    </section>
  );
}

/** 「메모 N개 · 장소 N곳」. 메모는 카드의 「메모 N개 보기」와 같은 기준(메모 + 운영시간) */
function countsOf(rows: TimelineRow[]) {
  return {
    memos: rows.reduce((n, r) => n + r.memos.length + (r.hours && !r.hoursOff ? 1 : 0), 0),
    places: rows.filter((r) => r.kind === "place").length,
  };
}
