import {
  addMonths,
  differenceInCalendarMonths,
  format,
  getDay,
  getDaysInMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

import { dateRangeLabel } from "./days";

/** 날짜는 모두 yyyy-MM-dd 문자열이다. 사전순 비교가 곧 날짜 비교다. */
export type DateRange = { start: string; end: string };
/** 고르는 중인 기간. 출발만 고른 상태면 end 가 null. */
export type DateSelection = { start: string; end: string | null } | null;

export type CalendarDay = {
  kind: "day";
  date: string;
  day: number;
  /** 지난 날짜. 수정 모드가 아니면 고를 수 없다. */
  disabled: boolean;
  today: boolean;
  /** 일 · 토 · 공휴일 */
  red: boolean;
  /** 고른 기간 안에서의 위치. single = 출발과 도착이 같은 날(또는 출발만 고름) */
  selected: "start" | "end" | "middle" | "single" | null;
  /** 다른 여행 기간의 띠. 주가 바뀌는 칸에서도 둥글게 닫는다. */
  other: { roundStart: boolean; roundEnd: boolean } | null;
  label: "오늘" | "다른 일정" | "출발" | "도착" | null;
};
export type CalendarCell = { kind: "blank" } | CalendarDay;

type MonthOptions = {
  today: string;
  selection: DateSelection;
  /** 「다른 일정」으로 깔아 둘 기존 여행 기간 */
  others: readonly DateRange[];
  /** 지난 날짜도 고를 수 있게 (수정 모드) */
  allowPast?: boolean;
  isHoliday?: (date: string) => boolean;
};

/** 한 달의 칸. 앞쪽은 일요일 시작에 맞춰 빈 칸으로 채운다. */
export function monthCells(year: number, month: number, opts: MonthOptions): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const lead = getDay(first);
  const cells: CalendarCell[] = Array.from({ length: lead }, () => ({ kind: "blank" }));
  const { today, selection, others, allowPast = false, isHoliday = () => false } = opts;

  for (let day = 1; day <= getDaysInMonth(first); day++) {
    const date = format(new Date(year, month - 1, day), "yyyy-MM-dd");
    const dow = (lead + day - 1) % 7;
    const cell: CalendarDay = {
      kind: "day",
      date,
      day,
      disabled: !allowPast && date < today,
      today: date === today,
      red: dow === 0 || dow === 6 || isHoliday(date),
      selected: null,
      other: null,
      label: date === today ? "오늘" : null,
    };

    const other = others.find((r) => date >= r.start && date <= r.end);
    if (other) {
      cell.other = {
        roundStart: date === other.start || dow === 0,
        roundEnd: date === other.end || dow === 6,
      };
      if (date === other.start) cell.label = "다른 일정";
    }

    cell.selected = selectedPosition(selection, date);
    const selectedLabel = labelOf(selection, cell.selected);
    if (selectedLabel) cell.label = selectedLabel;
    cells.push(cell);
  }
  return cells;
}

/** 고른 기간 안에서 date 의 위치. 기간 밖이면 null */
function selectedPosition(selection: DateSelection, date: string): CalendarDay["selected"] {
  if (!selection) return null;
  const end = selection.end ?? selection.start;
  if (date < selection.start || date > end) return null;
  const isStart = date === selection.start;
  const isEnd = date === end;
  if (isStart && isEnd) return "single";
  if (isStart) return "start";
  if (isEnd) return "end";
  return "middle";
}

/** 고른 기간의 라벨. 도착은 도착일까지 골랐을 때만 붙는다 */
function labelOf(selection: DateSelection, position: CalendarDay["selected"]) {
  if (position === "start" || position === "single") return "출발";
  if (position === "end" && selection?.end) return "도착";
  return null;
}

/**
 * 날짜를 눌렀을 때의 다음 선택.
 * 아직 없거나 둘 다 골랐으면 새 출발, 출발보다 앞을 누르면 새 출발, 그 밖엔 도착.
 * 출발일을 다시 누르면 당일치기가 된다.
 */
export function pickDate(selection: DateSelection, date: string): NonNullable<DateSelection> {
  if (!selection || selection.end || date < selection.start) return { start: date, end: null };
  return { start: selection.start, end: date };
}

/**
 * 두 날짜가 속한 달을 모두 포함하고, 이른 쪽 before 달 전부터 늦은 쪽 after 달 뒤까지.
 * focusIndex 는 첫 번째 날짜(a)가 속한 달의 위치 — 처음 보일 달이다.
 */
export function monthsSpanning(a: string, b: string, before: number, after: number) {
  const [early, late] = a <= b ? [a, b] : [b, a];
  const from = format(subMonths(parseISO(early), before), "yyyy-MM-dd");
  const count = differenceInCalendarMonths(parseISO(late), parseISO(early)) + before + 1 + after;
  const focusIndex = differenceInCalendarMonths(parseISO(a), parseISO(from));
  return { months: monthsFrom(from, count), focusIndex };
}

/** from 이 속한 달부터 count 달. [year, month(1~12)] */
export function monthsFrom(from: string, count: number): [number, number][] {
  const base = startOfMonth(parseISO(from));
  return Array.from({ length: count }, (_, i) => {
    const d = addMonths(base, i);
    return [d.getFullYear(), d.getMonth() + 1];
  });
}

/**
 * 기간 선택 CTA. 무엇을 눌러야 하는지 알려 주다가, 다 고르면 기간과 완료 동작을 보인다
 * (예: 「2026.11.6 - 11.8 / 등록 완료」, 수정 모드는 「… / 수정 완료」).
 */
export function rangeCtaLabel(selection: DateSelection, done: string) {
  if (!selection) return "출발일을 선택해 주세요";
  if (!selection.end) return "도착일을 선택해 주세요";
  return `${dateRangeLabel(selection.start, selection.end)} / ${done}`;
}
