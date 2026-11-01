/**
 * 여행 기간의 날마다 날씨 — 지난 날은 기록, 앞으로 16일 안은 예보, 그보다 먼 날은 작년 같은 날 기록, 그것도 없으면 그 달 평년.
 * 서버 라우트 `/api/weather/days` 가 이 규칙으로 Open-Meteo 를 나눠 부른다. 날짜는 yyyy-MM-dd
 * @see https://open-meteo.com/en/docs
 */
import type { WeatherDay, WeatherNormals } from "./weather";

/** 어디서 온 값인가 — 기록(지난 날) · 예보(오늘부터) · 작년 같은 날 기록 · 그 달 평년 */
export type WeatherSource = "record" | "forecast" | "lastYear" | "normal";

/** 날짜 하나의 날씨와 출처. 비 올 확률은 예보에만 있고, 평년은 날씨 코드도 없다(null) */
export type SourcedWeatherDay = WeatherDay & { source: WeatherSource };

/** 양끝을 포함하는 기간 */
export type DateRange = { start: string; end: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 한 번에 받는 최대 날 수 — 긴 여행도 들어가게, 대신 바깥 호출이 끝없이 길어지지 않게 */
const MAX_DAYS = 100;
/**
 * 예보 API 가 받는 날 — 오늘(UTC) 90일 전 ~ 15일 뒤. Open-Meteo 는 92일 전 ~ 15일 뒤까지 받는데,
 * 지난 쪽은 시간대 차이로 하루 어긋나도 넘지 않게 줄였다. 범위를 넘으면 요청 전체가 오류다
 */
const FORECAST_PAST = 90;
const FORECAST_AHEAD = 15;
/** 과거 기록 API 는 며칠 늦게 채워진다 — 그보다 가까운 작년 날짜는 없는 것으로 본다 */
const ARCHIVE_LAG = 7;

/** yyyy-MM-dd 에 n일을 더한다 */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 기간의 날짜들(날짜순) */
export function datesBetween(range: DateRange): string[] {
  const dates: string[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) dates.push(d);
  return dates;
}

/** 진짜 날짜인지 — 모양이 맞아도 2월 30일 같은 날은 아니다 */
function isDate(value: string | null): value is string {
  return !!value && DATE.test(value) && addDays(value, 0) === value;
}

/** 주소의 from · to → 기간. 날짜가 아니거나 거꾸로거나 100일을 넘으면 null */
export function parseRange(from: string | null, to: string | null): DateRange | null {
  if (!isDate(from) || !isDate(to) || from > to) return null;
  return addDays(from, MAX_DAYS - 1) >= to ? { start: from, end: to } : null;
}

/** 기간을 min ~ max 안으로 자른다(null 이면 그쪽은 자르지 않음). 남는 날이 없으면 null */
function clip(range: DateRange, min: string | null, max: string | null): DateRange | null {
  const start = min && min > range.start ? min : range.start;
  const end = max && max < range.end ? max : range.end;
  return start <= end ? { start, end } : null;
}

/** 기간을 예보 API 범위 앞(과거 기록 API) · 안(예보 API — 최근 지난 날도 이쪽이 정확하다) · 뒤(작년 같은 날)로 나눈다 */
export function splitRange(range: DateRange, todayUtc: string) {
  const forecastStart = addDays(todayUtc, -FORECAST_PAST);
  const forecastEnd = addDays(todayUtc, FORECAST_AHEAD);
  return {
    past: clip(range, null, addDays(forecastStart, -1)),
    forecast: clip(range, forecastStart, forecastEnd),
    far: clip(range, addDays(forecastEnd, 1), null),
  };
}

/** 작년 같은 날. 2월 29일은 2월 28일 */
export function lastYearOf(date: string): string {
  const year = Number(date.slice(0, 4)) - 1;
  const monthDay = date.slice(5) === "02-29" ? "02-28" : date.slice(5);
  return `${year}-${monthDay}`;
}

/** 먼 날들의 작년 같은 날 중 과거 기록이 있을 기간. 하루도 없으면(1년 넘게 남은 여행) null */
export function lastYearSpan(range: DateRange, todayUtc: string): DateRange | null {
  return clip(
    { start: lastYearOf(range.start), end: lastYearOf(range.end) },
    null,
    addDays(todayUtc, -ARCHIVE_LAG),
  );
}

/** Open-Meteo 응답의 시간대(초) 기준 그 장소의 오늘. 칸이 없으면 UTC */
export function localTodayOf(json: unknown, now: Date): string {
  const offset =
    typeof json === "object" && json !== null
      ? (json as { utc_offset_seconds?: unknown }).utc_offset_seconds
      : null;
  const ms = now.getTime() + (typeof offset === "number" ? offset * 1000 : 0);
  return new Date(ms).toISOString().slice(0, 10);
}

/** 예보 API 의 날들에 출처를 단다 — 그 장소의 오늘 전이면 기록(비 올 확률은 지난 날엔 뜻이 없어 뺀다), 오늘부터 예보 */
export function markForecast(days: WeatherDay[], localToday: string): SourcedWeatherDay[] {
  return days.map((d) =>
    d.date < localToday ? { ...d, rain: null, source: "record" } : { ...d, source: "forecast" },
  );
}

/** 과거 기록 API 의 날들 — 출처는 기록, 비 올 확률은 없다 */
export function markRecord(days: WeatherDay[]): SourcedWeatherDay[] {
  return days.map((d) => ({ ...d, rain: null, source: "record" }));
}

/** 먼 날들을 작년 같은 날 기록으로 채운다. 기록이 없는 날은 missing 으로 돌려준다(평년으로 채운다) */
export function fromLastYear(dates: string[], records: WeatherDay[]) {
  const byDate = new Map(records.map((r) => [r.date, r]));
  const found: SourcedWeatherDay[] = [];
  const missing: string[] = [];
  for (const date of dates) {
    const r = byDate.get(lastYearOf(date));
    if (r) found.push({ ...r, date, rain: null, source: "lastYear" });
    else missing.push(date);
  }
  return { found, missing };
}

/** 날짜의 달(1–12) */
export const monthOf = (date: string) => Number(date.slice(5, 7));

/** 날들을 그 달 평년으로 채운다. 평년을 모르는 달의 날은 뺀다 */
export function normalDays(
  dates: string[],
  normalsOf: (month: number) => WeatherNormals | null,
): SourcedWeatherDay[] {
  return dates.flatMap((date) => {
    const n = normalsOf(monthOf(date));
    return n ? [{ date, code: null, max: n.max, min: n.min, rain: null, source: "normal" }] : [];
  });
}
