import type { Flight } from "../model/types";
import { airportOf } from "./airports";

/** 날짜 · 시각 · 공항만 보는 계산의 입력 */
type FlightTimes = Pick<
  Flight,
  "dep_airport" | "arr_airport" | "dep_date" | "dep_time" | "arr_date" | "arr_time"
>;

const DOW = "일월화수목금토";

/** 「2026.10.31 (토)」 */
export function flightDateLabel(date: string): string {
  const dow = DOW[new Date(`${date}T00:00:00`).getDay()];
  return `${date.replaceAll("-", ".")} (${dow})`;
}

/** DB 시각(「07:15:00」)을 「07:15」 로 */
export function hhmm(time: string): string {
  return time.slice(0, 5);
}

/** 도착일이 출발일보다 며칠 뒤인지 — 같은 날이면 0 */
export function dayDiff(f: Pick<Flight, "dep_date" | "arr_date">): number {
  return Math.round((Date.parse(f.arr_date) - Date.parse(f.dep_date)) / 86_400_000);
}

/** 그 시각에 시간대가 UTC 보다 몇 분 앞서는지 */
function offsetMinutes(tz: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(utcMs));
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute")) - utcMs) / 60_000;
}

/** 그 시간대의 현지 날짜 · 시각을 UTC 밀리초로 */
function zonedMs(date: string, time: string, tz: string): number {
  const local = Date.parse(`${date}T${hhmm(time)}:00Z`);
  // 현지 시각을 UTC 로 본 값에서 그때의 시차를 뺀다. 서머타임 경계 근처를 위해 한 번 더 맞춘다
  const guess = local - offsetMinutes(tz, local) * 60_000;
  return local - offsetMinutes(tz, guess) * 60_000;
}

/**
 * 비행 시간(분) — 두 공항의 시간대로 현지 시각을 맞춰 뺀다. 목록에 없는 공항(직접 넣은 코드)이면 시간대를 몰라 null.
 * 0 이하(입력이 어긋남)도 null
 */
export function flightMinutes(f: FlightTimes): number | null {
  const dep = airportOf(f.dep_airport);
  const arr = airportOf(f.arr_airport);
  if (!dep || !arr) return null;
  const mins =
    (zonedMs(f.arr_date, f.arr_time, arr.tz) - zonedMs(f.dep_date, f.dep_time, dep.tz)) / 60_000;
  return mins > 0 ? Math.round(mins) : null;
}

/** 「2시간 25분」 · 「2시간」 · 「45분」. 모르면 "" */
export function durationLabel(minutes: number | null): string {
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

/**
 * 출발 순 항공편마다 방향 — 첫 편은 「가는 편」, 마지막 편은 「오는 편」, 가운데는 「항공편」. 하나뿐이면 「가는 편」
 */
export function directionLabel(index: number, count: number): string {
  if (index === 0) return "가는 편";
  return index === count - 1 ? "오는 편" : "항공편";
}

/** 공항 이름 — 목록에 없으면 코드 */
export function airportName(code: string): string {
  return airportOf(code)?.name ?? code;
}
