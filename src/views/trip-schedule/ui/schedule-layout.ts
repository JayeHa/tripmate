import type { MemoAuthor, TimelineRow, useOpenMemos } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { ScheduleEditState } from "@/features/schedule/edit-mode";

/** 모바일 · PC 일정 레이아웃이 받는 값. 상태와 동작은 화면(TripScheduleView)이 쥐고 레이아웃은 그린다 */
export type ScheduleLayoutProps = {
  trip: Trip | undefined;
  totalDays: number;
  day: number;
  onDayChange: (day: number) => void;
  rows: TimelineRow[];
  isPending: boolean;
  memos: ReturnType<typeof useOpenMemos>;
  onOpen: (row: TimelineRow) => void;
  onEditMove?: (row: TimelineRow) => void;
  onAddPlace: () => void;
  /** 날짜 끝 「메모 추가」 — 날짜 메모 */
  onAddDayMemo: () => void;
  /** 메모 작성자 표시 */
  authorOf: (authorId: string | null) => MemoAuthor | null;
  /** 일정 편집. 열려 있으면 모바일은 화면 전체를, PC 는 목록 칸을 편집 화면으로 바꾼다 */
  edit: ScheduleEditState;
  /** 「편집」(day 헤더 · 플로팅) — 보고 있던 날로 편집을 연다. 일정 · 여행을 읽는 동안은 없다 */
  onStartEdit?: () => void;
};
