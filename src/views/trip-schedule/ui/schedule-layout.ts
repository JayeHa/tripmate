import type { MemoAuthor, TimelineRow, useOpenMemos } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

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
  /** 메모 작성자 표시 */
  authorOf: (authorId: string | null) => MemoAuthor | null;
};
