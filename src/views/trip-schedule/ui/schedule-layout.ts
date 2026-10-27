import type { MemoAuthor, TimelineRow } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { ScheduleEditState } from "@/features/schedule/edit-mode";

import type { DaySectionData } from "../model/use-schedule-sections";

/** 뷰가 「그 날을 보여 줘」 할 때 레이아웃에 보내는 스크롤 요청. at 이 바뀌면 같은 날이라도 다시 간다 */
export type DayJump = { day: number; at: number };

/**
 * 모바일 · PC 일정 레이아웃이 받는 값. 상태와 동작은 화면(TripScheduleView)이 쥐고 레이아웃은 그린다.
 * 모든 날짜를 이어서 그리고, 보고 있는 날이 바뀌면 onDayChange 로 알린다(`?day` · 칩 · 레일 · 지도가 따라간다)
 */
export type ScheduleLayoutProps = {
  trip: Trip | undefined;
  totalDays: number;
  /** 보고 있는 날(`?day`) */
  day: number;
  /** 스크롤로 보고 있는 날이 바뀌었다 */
  onDayChange: (day: number) => void;
  /** 날마다의 타임라인 줄 */
  sections: DaySectionData[];
  /** 그 날(0-base)의 여행지 공휴일 이름 — day 머리 · PC 레일에 빨갛게. 공휴일이 아니거나 모르면 null */
  holidayOf: (day: number) => string | null;
  isPending: boolean;
  /** 뷰가 보내는 「그 날로 스크롤」 요청 */
  jump: DayJump | null;
  onOpen: (row: TimelineRow) => void;
  onEditMove?: (row: TimelineRow) => void;
  /** 그 날짜의 「일정 추가」 · 플로팅 — 그 날로 일정 추가 창을 연다 */
  onAddPlace: (day: number) => void;
  /** 그 날짜의 「메모 추가」 · 플로팅 — 날짜 메모 */
  onAddDayMemo: (day: number) => void;
  /** 메모 작성자 표시 */
  authorOf: (authorId: string | null) => MemoAuthor | null;
  /** 카드의 「체크리스트 N」 칩 — 끝나지 않은 항목 수와 노트 체크리스트 주소 */
  checklistOf: (row: TimelineRow) => { count: number; href: string };
  /** 카드의 「바우처 N」 칩 — 바우처 수와 누르면 할 일(하나면 뷰어, 여럿이면 일정 상세) */
  voucherOf: (row: TimelineRow) => { count: number; onOpen: () => void };
  /** 일정 편집. 열려 있으면 모바일은 화면 전체를, PC 는 목록 칸을 편집 화면으로 바꾼다 */
  edit: ScheduleEditState;
  /** 「편집」(day 헤더 · 플로팅) — 그 날로 편집을 여는 동작. 일정 · 여행을 읽는 동안은 undefined */
  startEditAt: (day: number) => (() => void) | undefined;
  /** 숙소 창(PC 레일 아래 · 모바일 여행 머리) */
  onOpenStays: () => void;
  stayCount: number;
  /** 항공편 창(PC 레일 아래 · 모바일 여행 머리) */
  onOpenFlights: () => void;
  flightCount: number;
};
