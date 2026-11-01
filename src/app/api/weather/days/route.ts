import { type NextRequest, NextResponse } from "next/server";

import { parseForecast, type WeatherNormals } from "@/shared/lib/weather";
import {
  type DateRange,
  datesBetween,
  fromLastYear,
  lastYearSpan,
  localTodayOf,
  markForecast,
  markRecord,
  monthOf,
  normalDays,
  parseRange,
  type SourcedWeatherDay,
  splitRange,
} from "@/shared/lib/weather-days";

import { cityCoords } from "../city";
import { archiveOf, type Coords, dailyOf, FORECAST_API, monthNormals } from "../open-meteo";

/** 예보는 몇 시간마다 바뀌어 서버가 한 시간 동안 같은 응답을 다시 쓴다(초) */
const HOUR = 3600;
const FORECAST_FIELDS =
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max";
const RECORD_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min";

/** 응답 → 하루 값들. 모양이 다르면 던진다 */
function parsed(json: unknown) {
  const days = parseForecast(json);
  if (!days) throw new Error("open-meteo 응답 모양");
  return days;
}

/** 예보 API 범위보다 지난 날 — 과거 기록 */
async function pastDays(coords: Coords, range: DateRange) {
  return markRecord(parsed(await archiveOf(coords, range, RECORD_FIELDS)));
}

/** 예보 API 범위 안 — 그 장소의 오늘 전은 기록, 오늘부터 예보 */
async function forecastDays(coords: Coords, range: DateRange) {
  const json = await dailyOf(FORECAST_API, coords, range, FORECAST_FIELDS, HOUR);
  return markForecast(parsed(json), localTodayOf(json, new Date()));
}

/** 예보보다 먼 날 — 작년 같은 날 기록, 없으면(1년 넘게 남았음) 그 달 평년 */
async function farDays(coords: Coords, range: DateRange, todayUtc: string) {
  const span = lastYearSpan(range, todayUtc);
  const records = span ? parsed(await archiveOf(coords, span, RECORD_FIELDS)) : [];
  const { found, missing } = fromLastYear(datesBetween(range), records);
  const months = [...new Set(missing.map(monthOf))];
  const normals = new Map<number, WeatherNormals | null>(
    await Promise.all(months.map(async (m) => [m, await monthNormals(coords, m)] as const)),
  );
  return [...found, ...normalDays(missing, (m) => normals.get(m) ?? null)];
}

/**
 * 도시의 여행 기간 날마다 날씨 — `?city=tokyo&from=2026-10-31&to=2026-11-04` → 날짜순 `[{ date, code, max, min, rain, source }]`.
 * 지난 날은 기록, 앞으로 16일 안은 예보, 그보다 먼 날은 작년 같은 날 기록, 그것도 없으면 그 달 평년(`source`).
 * 바깥 서비스는 도시 목록 안에서만 부르고 서버가 예보는 한 시간, 지난 기록은 30일 동안 다시 쓴다.
 * 기간이 이상하면 400, 로그인하지 않았거나 모르는 도시면 404, 실패하면 502 — 화면은 날씨 줄을 뺀다
 * @see https://open-meteo.com/en/docs
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const range = parseRange(params.get("from"), params.get("to"));
  if (!range) return NextResponse.json({ error: "기간을 확인해 주세요" }, { status: 400 });
  try {
    const coords = await cityCoords(params);
    if (!coords) return NextResponse.json({ error: "도시를 확인해 주세요" }, { status: 404 });
    const todayUtc = new Date().toISOString().slice(0, 10);
    const parts = splitRange(range, todayUtc);
    const none: SourcedWeatherDay[] = [];
    const chunks = await Promise.all([
      parts.past ? pastDays(coords, parts.past) : none,
      parts.forecast ? forecastDays(coords, parts.forecast) : none,
      parts.far ? farDays(coords, parts.far, todayUtc) : none,
    ]);
    const days = chunks.flat().sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json(days);
  } catch (e) {
    console.error("weather-days", e);
    return NextResponse.json({ error: "날씨를 가져오지 못했어요" }, { status: 502 });
  }
}
