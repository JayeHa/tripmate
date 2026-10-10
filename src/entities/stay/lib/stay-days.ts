import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

import { dayCount } from "@/shared/lib/days";

/** 숙박 날짜(체크인 · 체크아웃, yyyy-MM-dd) */
export type StayDates = { check_in_date: string; check_out_date: string };
type TripDates = { start_date: string; end_date: string };
/** 연결 카드를 세는 데 필요한 일정 줄의 칸 */
type LinkedItem = { stay_id: string | null; alternative_of: string | null; day_index: number };

/** 몇 박인지 */
export function nightsOf(dates: StayDates): number {
  return differenceInCalendarDays(parseISO(dates.check_out_date), parseISO(dates.check_in_date));
}

/**
 * 연결 카드가 생기는 날 번호 범위(0-base, 양 끝 포함) — 체크인 ~ 체크아웃을 여행 기간으로 자른 것.
 * 여행 밖이면 null. DB 의 save_stay 와 같은 규칙이라 확인창의 개수가 서버와 맞는다
 */
export function stayDayRange(
  dates: StayDates,
  trip: TripDates,
): { from: number; to: number } | null {
  const start = parseISO(trip.start_date);
  const from = Math.max(differenceInCalendarDays(parseISO(dates.check_in_date), start), 0);
  const to = Math.min(
    differenceInCalendarDays(parseISO(dates.check_out_date), start),
    dayCount(trip.start_date, trip.end_date) - 1,
  );
  return from <= to ? { from, to } : null;
}

/** 그 숙소의 타임라인 연결 카드 수(대체 장소 줄은 빼고) */
export function linkedCardCount(items: readonly LinkedItem[], stayId: string): number {
  return items.filter((i) => i.stay_id === stayId && i.alternative_of === null).length;
}

/**
 * 숙박 기간을 바꾸면 밀려나는 연결 카드 수 — 옛 범위에는 있고 새 범위에는 없는 날의 카드.
 * 사용자가 범위 밖으로 옮겨 둔 카드는 세지 않는다(save_stay 의 정리와 같은 규칙)
 */
export function pushedOutCount(
  items: readonly LinkedItem[],
  stayId: string,
  oldDates: StayDates,
  newDates: StayDates,
  trip: TripDates,
): number {
  const old = stayDayRange(oldDates, trip);
  if (!old) return 0;
  const next = stayDayRange(newDates, trip);
  return items.filter(
    (i) =>
      i.stay_id === stayId &&
      i.alternative_of === null &&
      i.day_index >= old.from &&
      i.day_index <= old.to &&
      (!next || i.day_index < next.from || i.day_index > next.to),
  ).length;
}

/** 「10.31(토) – 11.1(일) · 1박」 */
export function stayRangeLabel(dates: StayDates): string {
  const f = (d: string) => format(parseISO(d), "M.d(EEE)", { locale: ko });
  return `${f(dates.check_in_date)} – ${f(dates.check_out_date)} · ${nightsOf(dates)}박`;
}

/** 「11.1(일) 15:00」 — 시각이 없으면 날짜만 */
export function stayMomentLabel(date: string, time: string | null): string {
  const day = format(parseISO(date), "M.d(EEE)", { locale: ko });
  return time ? `${day} ${time.slice(0, 5)}` : day;
}
