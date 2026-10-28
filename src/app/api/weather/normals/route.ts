import { type NextRequest, NextResponse } from "next/server";

import { averageNormals, normalsRanges, parseCoords } from "@/shared/lib/weather";

/** Open-Meteo 과거 날씨(키 없음 · 비상업 무료 · CC BY 4.0 이라 화면에 출처 링크 필요) */
const SOURCE = "https://archive-api.open-meteo.com/v1/archive";
/** 서버가 받은 응답을 다시 쓰는 시간(초) — 지난 기록이라 바뀌지 않는다. 30일 */
const REVALIDATE = 2_592_000;

/** 한 해 그 달의 하루 최고 · 최저 기온 기록. 실패하면 던진다 */
async function monthRecord(lat: number, lng: number, range: { start: string; end: string }) {
  const url = new URL(SOURCE);
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: range.start,
    end_date: range.end,
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  }).toString();
  const res = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`archive ${res.status}`);
  return (await res.json()) as unknown;
}

/**
 * 장소의 그 달 평년 기온 — `?lat=&lng=&month=11`. 최근 10년 그 달의 하루 최고 · 최저 평균.
 * 해마다 한 번씩 10번 부른다(한 번에 10년을 받는 것보다 Open-Meteo 호출 수가 적다). 브라우저는 하루, Vercel 은 30일 동안 같은 응답을 다시 쓴다.
 * 실패하면 502 — 화면은 날씨 타일을 뺀다
 * @see https://open-meteo.com/en/docs/historical-weather-api
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const coords = parseCoords(params);
  const month = Number(params.get("month"));
  if (!coords || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "좌표 · 달을 확인해 주세요" }, { status: 400 });
  }
  try {
    const ranges = normalsRanges(month, new Date().getUTCFullYear());
    const records = await Promise.all(ranges.map((r) => monthRecord(coords.lat, coords.lng, r)));
    const normals = averageNormals(records);
    if (!normals)
      return NextResponse.json({ error: "평년 기온을 가져오지 못했어요" }, { status: 502 });
    return NextResponse.json(normals, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" },
    });
  } catch (e) {
    console.error("weather-normals", e);
    return NextResponse.json({ error: "평년 기온을 가져오지 못했어요" }, { status: 502 });
  }
}
