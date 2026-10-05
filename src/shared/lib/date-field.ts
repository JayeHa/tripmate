import { addMonths, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import { type CalendarCell, type DateSelection, monthCells } from "./calendar";
import { dayCount } from "./days";

/** 날짜 칸 값 — 「2026.10.28 (수)」 */
export function dateFieldLabel(date: string): string {
  return format(parseISO(date), "yyyy.MM.dd (EEE)", { locale: ko });
}

/** 기간 칸 값 — 「2026.10.31 (토) – 11.04」. 해가 바뀌면 끝에도 연도를 붙인다 */
export function rangeFieldLabel(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${dateFieldLabel(start)} – ${format(parseISO(end), sameYear ? "MM.dd" : "yyyy.MM.dd")}`;
}

/** 「4박 5일」 */
export function nightsLabel(start: string, end: string): string {
  const days = dayCount(start, end);
  return `${days - 1}박 ${days}일`;
}

/**
 * 기간 고르기 위의 안내 — 무엇을 누를지 알려 주다가, 다 고르면 「10.31 – 11.04 · 4박 5일」.
 * done 이면 다 고른 것(블루로 보인다)
 */
export function rangeHint(selection: DateSelection): { text: string; done: boolean } {
  if (!selection) return { text: "시작일을 선택해 주세요", done: false };
  if (!selection.end) return { text: "종료일을 선택해 주세요", done: false };
  const { start, end } = selection;
  return {
    text: `${format(parseISO(start), "MM.dd")} – ${format(parseISO(end), "MM.dd")} · ${nightsLabel(start, end)}`,
    done: true,
  };
}

/** 「2026년 10월」 의 [연, 월(1–12)] */
export type YearMonth = [number, number];

/** date 가 속한 달 */
export function monthOf(date: string): YearMonth {
  const d = parseISO(date);
  return [d.getFullYear(), d.getMonth() + 1];
}

/** 몇 달 앞뒤로 옮긴 달 */
export function shiftMonth([year, month]: YearMonth, by: number): YearMonth {
  const d = addMonths(new Date(year, month - 1, 1), by);
  return [d.getFullYear(), d.getMonth() + 1];
}

/**
 * 날짜 고르기 팝오버의 한 달 — 다른 일정 띠는 없고, min 보다 앞은 고를 수 없다(지난 날짜는 고를 수 있다).
 * 칸의 라벨(오늘 · 출발 · 도착)은 이 팝오버에서 쓰지 않는다
 */
export function pickerCells(
  [year, month]: YearMonth,
  opts: { today: string; selection: DateSelection; min?: string },
): CalendarCell[] {
  return monthCells(year, month, {
    today: opts.today,
    selection: opts.selection,
    others: [],
    allowPast: true,
  }).map((c) =>
    c.kind === "blank"
      ? c
      : { ...c, label: null, disabled: opts.min !== undefined && c.date < opts.min },
  );
}
