import { dayCount, dayIndexToDate } from "@/shared/lib/days";
import { SKY_LABEL, skyOf, type WeatherDay, type WeatherNormals } from "@/shared/lib/weather";

import type { WidgetTile } from "./widgets";

/** 예보를 보이기 시작하는 때 — 여행 10일 전부터. 그 전에는 예보가 맞지 않아 평년 기온 */
const FORECAST_FROM = 10;

/**
 * 날씨 타일이 보일 것 — 그 날의 예보(여행 중이면 오늘, 여행 10일 전부터는 첫날) · 그 달의 평년 기온(그보다 이르면) · 없음(여행이 끝남)
 */
export type WeatherPlan =
  { kind: "forecast"; date: string; first: boolean } | { kind: "normals"; month: number } | null;

/** 여행 날이 가장 많은 달(1–12, 같으면 앞 달) — 10.31–11.4 면 11 */
export function tripMonth(start: string, end: string): number {
  const counts = new Map<number, number>();
  for (let i = 0; i < dayCount(start, end); i++) {
    const month = Number(dayIndexToDate(start, i).slice(5, 7));
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  let best = Number(start.slice(5, 7));
  for (const [month, n] of counts) if (n > (counts.get(best) ?? 0)) best = month;
  return best;
}

/** 오늘(그 장소의 현지 날짜 yyyy-MM-dd)로 날씨 타일이 보일 것을 정한다 */
export function weatherPlan(start: string, end: string, today: string): WeatherPlan {
  if (today > end) return null;
  if (today >= start) return { kind: "forecast", date: today, first: false };
  if (dayCount(today, start) - 1 <= FORECAST_FROM) {
    return { kind: "forecast", date: start, first: true };
  }
  return { kind: "normals", month: tripMonth(start, end) };
}

/** 그 시간대의 오늘(yyyy-MM-dd) — 예보 날짜가 그 장소의 현지 날짜라 같은 기준으로 고른다 */
export function localToday(timeZone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** 소수 기온 → 「18°」 */
const degree = (c: number) => `${Math.round(c)}°`;

/**
 * 날씨 타일 — 평년이면 「날씨 · 12–19° · 11월 평년」, 예보면 「날씨 · 맑음 · 18° · 최저 12° · 비 60%」(큰 값은 최고 기온).
 * 여행 전 예보는 첫날 것이라 라벨이 「첫날 · 맑음」. 아직 받지 못했거나 그 날 예보가 없으면 null
 */
export function weatherTile(
  plan: WeatherPlan,
  days: readonly WeatherDay[] | undefined,
  normals: WeatherNormals | undefined,
): WidgetTile | null {
  if (!plan) return null;
  if (plan.kind === "normals") {
    if (!normals) return null;
    return {
      key: "weather",
      label: "날씨",
      main: `${Math.round(normals.min)}–${degree(normals.max)}`,
      sub: `${plan.month}월 평년`,
      sky: "partly",
    };
  }
  const day = days?.find((d) => d.date === plan.date);
  if (!day) return null;
  const sky = skyOf(day.code);
  return {
    key: "weather",
    label: [plan.first ? "첫날" : "날씨", sky && SKY_LABEL[sky]].filter(Boolean).join(" · "),
    main: degree(day.max),
    sub: [`최저 ${degree(day.min)}`, day.rain === null ? null : `비 ${day.rain}%`]
      .filter(Boolean)
      .join(" · "),
    ...(sky && { sky }),
  };
}
