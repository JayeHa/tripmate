import { z } from "zod";

import type { Json } from "@/shared/api/supabase/database.types";

/** 요일 키 — 월요일부터(입력 칸 순서) */
export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const WEEK_DAY_LABEL = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
} satisfies Record<WeekDay, string>;

/** 요일별 운영시간. 값이 null 이면 그 요일 휴무, 키가 없으면 모름(places.hours_week) */
export type WeekHours = Partial<Record<WeekDay, string | null>>;

const dayValueSchema = z.string().nullable();

/** Date.getDay()(0 = 일요일) → 요일 키 */
export function weekDayOf(dow: number): WeekDay {
  return WEEK_DAYS[(dow + 6) % 7];
}

/**
 * DB 의 요일별 운영시간. 아는 요일 키(mon~sun)의 값(문자열 · null)만 골라 담고 나머지 키 · 틀린 값은 버린다 —
 * 하나가 틀렸다고 요일별 전체가 조용히 사라지지 않게(DB check 는 객체인지만 본다). 남은 요일이 없으면 null(「매일 같음」 을 본다)
 */
export function weekHoursOf(value: Json | null | undefined): WeekHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const week: WeekHours = {};
  for (const day of WEEK_DAYS) {
    const parsed = dayValueSchema.safeParse(value[day]);
    if (day in value && parsed.success) week[day] = parsed.data;
  }
  return Object.keys(week).length > 0 ? week : null;
}

/** 그날의 운영시간 한 줄. off 면 휴무(카드에 경고 칩) */
export type DayHours = { text: string; off: boolean };

/**
 * 그 요일의 운영시간. 요일별이 있으면 그 요일 값만 대표로(「일 10:00–22:00」 · 「일요일 휴무」), 그 요일을 모르면 null.
 * 요일별이 없으면 매일 같은 운영시간 그대로. 요일을 모르면(dow null) 요일별 장소는 null.
 */
export function hoursOnDay(
  place: { hours: string | null; hours_week: Json | null },
  dow: number | null,
): DayHours | null {
  const week = weekHoursOf(place.hours_week);
  if (!week) return place.hours ? { text: place.hours, off: false } : null;
  if (dow === null) return null;
  const day = weekDayOf(dow);
  const value = week[day];
  if (value === undefined) return null;
  const label = WEEK_DAY_LABEL[day];
  return value === null
    ? { text: `${label}요일 휴무`, off: true }
    : { text: `${label} ${value}`, off: false };
}
