import { type NextRequest, NextResponse } from "next/server";

import { parseForecast } from "@/shared/lib/weather";

import { cityCoords } from "../city";

/** Open-Meteo 예보(키 없음 · 비상업 무료 · CC BY 4.0 이라 화면에 출처 링크 필요) */
const SOURCE = "https://api.open-meteo.com/v1/forecast";
/** 서버가 받은 응답을 다시 쓰는 시간(초) — 예보는 몇 시간마다 바뀌어 한 시간이면 충분하다 */
const REVALIDATE = 3600;
/** 받는 날 수 — 여행 10일 전부터 예보를 보이므로 그 날까지 들어오게(최대 16) */
const DAYS = 16;

/**
 * 도시의 앞으로 16일 하루 예보 — `?city=tokyo`. 날짜는 그 장소의 현지 날짜(`timezone=auto`).
 * 바깥 서비스는 서버가 도시마다 한 시간에 한 번만 부른다(도시 목록 안에서만 — 무료 범위를 넘지 않는다).
 * 로그인하지 않았거나 모르는 도시면 404, 실패하면 502 — 화면은 날씨 타일을 뺀다
 * @see https://open-meteo.com/en/docs
 */
export async function GET(request: NextRequest) {
  try {
    const coords = await cityCoords(request.nextUrl.searchParams);
    if (!coords) return NextResponse.json({ error: "도시를 확인해 주세요" }, { status: 404 });
    const url = new URL(SOURCE);
    url.search = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lng),
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "auto",
      forecast_days: String(DAYS),
    }).toString();
    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    const days = res.ok ? parseForecast(await res.json()) : null;
    if (!days) return NextResponse.json({ error: "예보를 가져오지 못했어요" }, { status: 502 });
    return NextResponse.json(days);
  } catch (e) {
    console.error("weather-forecast", e);
    return NextResponse.json({ error: "예보를 가져오지 못했어요" }, { status: 502 });
  }
}
