import {
  type MemoAuthor,
  Timeline,
  type TimelineRow,
  type useOpenMemos,
} from "@/entities/schedule-item";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { DayHeader } from "./day-header";

type DayBodyProps = {
  startDate: string | null;
  day: number;
  /** 그날 하루 요약 */
  summary?: string | null;
  rows: TimelineRow[];
  isPending: boolean;
  memos: ReturnType<typeof useOpenMemos>;
  /** PC 는 day 헤더 아래에 「메모 N개 · 장소 N곳」 을 함께 보인다 */
  showCounts?: boolean;
  /** 지도에 강조된 장소. 그 행에 배경을 깐다 */
  focusId?: string | null;
  onOpen: (row: TimelineRow) => void;
  onEditMove?: (row: TimelineRow) => void;
  onAddPlace: () => void;
  onAddDayMemo: () => void;
  authorOf: (authorId: string | null) => MemoAuthor | null;
  onStartEdit: () => void;
};

/** 하루치 본문 — day 헤더 · 빈 상태 · 타임라인 · 「일정 추가」. 모바일과 PC 목록이 같이 쓴다 */
export function DayBody({
  startDate,
  day,
  summary,
  rows,
  isPending,
  memos,
  showCounts,
  focusId,
  onOpen,
  onEditMove,
  onAddPlace,
  onAddDayMemo,
  authorOf,
  onStartEdit,
}: DayBodyProps) {
  return (
    <>
      {startDate && (
        <DayHeader
          startDate={startDate}
          day={day}
          hasMemos={memos.hasMemos}
          allOpen={memos.allOpen}
          onToggleAll={memos.toggleAll}
          counts={showCounts ? countsOf(rows) : undefined}
          summary={summary}
          onEdit={isPending ? undefined : onStartEdit}
        />
      )}
      {isPending && (
        <div className="flex flex-col gap-3 px-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      )}
      {!isPending && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="font-medium">아직 일정이 없어요</p>
          <p className="text-sm text-muted-foreground">아래 버튼으로 일정을 추가해보세요.</p>
        </div>
      )}
      <Timeline
        rows={rows}
        openIds={memos.openIds}
        onToggleMemo={memos.toggle}
        onOpen={onOpen}
        onEditMove={onEditMove}
        focusId={focusId}
        authorOf={authorOf}
      />
      <div className="flex gap-2.5 px-5 pt-1 pb-8">
        <Button variant="outline" size="form" className="flex-1" onClick={onAddPlace}>
          일정 추가
        </Button>
        <Button variant="outline" size="form" className="flex-1" onClick={onAddDayMemo}>
          메모 추가
        </Button>
      </div>
    </>
  );
}

/** 「메모 N개 · 장소 N곳」. 메모는 카드의 「메모 N개 보기」와 같은 기준(메모 + 운영시간) */
function countsOf(rows: TimelineRow[]) {
  return {
    memos: rows.reduce((n, r) => n + r.memos.length + (r.hours && !r.hoursOff ? 1 : 0), 0),
    places: rows.filter((r) => r.kind === "place").length,
  };
}
