import "server-only";

import { averageNormals, normalsRanges } from "@/shared/lib/weather";
import type { DateRange } from "@/shared/lib/weather-days";

/** Open-Meteo 예보 · 과거 날씨(키 없음 · 비상업 무료 · CC BY 4.0 이라 화면에 출처 링크 필요) */
export const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive";
/** 지난 기록은 바뀌지 않아 서버가 30일 동안 다시 쓴다(초) */
const MONTH = 2_592_000;

export type Coords = { lat: number; lng: number };

/**
 * 기간의 하루 값 요청(날짜는 그 장소의 현지 날짜 — `timezone=auto`). 서버가 revalidate 초 동안 같은 응답을 다시 쓴다.
 * 실패하면 던진다
 * @see https://open-meteo.com/en/docs
 */
export async function dailyOf(
  source: string,
  coords: Coords,
  range: DateRange,
  daily: string,
  revalidate: number,
): Promise<unknown> {
  const url = new URL(source);
  url.search = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lng),
    start_date: range.start,
    end_date: range.end,
    daily,
    timezone: "auto",
  }).toString();
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  return (await res.json()) as unknown;
}

/**
 * 과거 날씨 기록. 며칠 늦게 채워진다
 * @see https://open-meteo.com/en/docs/historical-weather-api
 */
export const archiveOf = (coords: Coords, range: DateRange, daily: string) =>
  dailyOf(ARCHIVE_API, coords, range, daily, MONTH);

/**
 * 그 달(1–12)의 평년 기온 — 최근 10년 그 달의 하루 최고 · 최저 평균. 해마다 한 번씩 10번 부른다
 * (한 번에 10년을 받는 것보다 Open-Meteo 호출 수가 적다). 받은 값이 없으면 null, 실패하면 던진다
 */
export async function monthNormals(coords: Coords, month: number) {
  const ranges = normalsRanges(month, new Date().getUTCFullYear());
  const records = await Promise.all(
    ranges.map((r) => archiveOf(coords, r, "temperature_2m_max,temperature_2m_min")),
  );
  return averageNormals(records);
}
