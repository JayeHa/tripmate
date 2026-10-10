import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import type { StayCardInfo, TimelineRow } from "@/entities/schedule-item";
import { dayIndexToDate } from "@/shared/lib/days";

/** 숙소 카드에 필요한 숙소 칸 */
type StayDates = {
  id: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
};

/** 「11.1 (일) 15:00」 — 시각이 없으면 날짜만 */
function fullMoment(date: string, time: string | null): string {
  const day = format(parseISO(date), "M.d (EEE)", { locale: ko });
  return time ? `${day} ${time.slice(0, 5)}` : day;
}

/** 「11.4 10:00」 */
function shortMoment(date: string, time: string | null): string {
  const day = format(parseISO(date), "M.d");
  return time ? `${day} ${time.slice(0, 5)}` : day;
}

/** 박 수 · 그날이 몇 박째인지 */
function nightOf(stay: StayDates, date: string) {
  const day = (d: string) => parseISO(d).getTime() / 86_400_000;
  return {
    k: Math.round(day(date) - day(stay.check_in_date)) + 1,
    n: Math.round(day(stay.check_out_date) - day(stay.check_in_date)),
  };
}

/**
 * 간략히 한 줄 — 체크아웃 날 「체크아웃 10:00」, 체크인 전 날 「체크인 전」, 그 사이 「숙박 2/3박 · 체크아웃 11.4 10:00」.
 * 체크아웃 시각이 없으면 「체크아웃」 만
 */
function midLine(stay: StayDates, date: string): string {
  if (date >= stay.check_out_date) {
    return ["체크아웃", stay.check_out_time?.slice(0, 5)].filter(Boolean).join(" ");
  }
  if (date < stay.check_in_date) return "체크인 전";
  const { k, n } = nightOf(stay, date);
  return `숙박 ${k}/${n}박 · 체크아웃 ${shortMoment(stay.check_out_date, stay.check_out_time)}`;
}

/**
 * 그날 줄들에 숙소 카드 모양을 붙인다(숙소에 연결된 카드만). 체크인 날 그 숙소 카드 중 가장 위 한 장이 「자세히」, 나머지는 「간략히」.
 * 순서 · 날짜를 옮기면 렌더할 때마다 다시 계산된다. 숙소를 못 찾으면(아직 못 읽음) 일반 카드로 둔다
 */
export function withStayCards(
  rows: TimelineRow[],
  stays: readonly StayDates[],
  startDate: string,
  day: number,
): TimelineRow[] {
  if (stays.length === 0) return rows;
  const date = dayIndexToDate(startDate, day);
  const seen = new Set<string>();
  return rows.map((row) => {
    const stay = row.item.stay_id ? stays.find((s) => s.id === row.item.stay_id) : undefined;
    if (!stay) return row;
    const first = !seen.has(stay.id);
    seen.add(stay.id);
    const info: StayCardInfo =
      first && date === stay.check_in_date
        ? {
            mode: "in",
            inText: fullMoment(stay.check_in_date, stay.check_in_time),
            outText: fullMoment(stay.check_out_date, stay.check_out_time),
          }
        : { mode: "mid", line: midLine(stay, date) };
    return { ...row, stay: info };
  });
}
