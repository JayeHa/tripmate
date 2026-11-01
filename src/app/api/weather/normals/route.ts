import { type NextRequest, NextResponse } from "next/server";

import { cityCoords } from "../city";
import { monthNormals } from "../open-meteo";

/**
 * 도시의 그 달 평년 기온 — `?city=tokyo&month=11`. 최근 10년 그 달의 하루 최고 · 최저 평균.
 * 서버는 30일, 브라우저는 하루 동안 같은 응답을 다시 쓴다
 * (로그인을 확인하므로 CDN 에는 두지 않는다). 로그인하지 않았거나 모르는 도시면 404, 실패하면 502 — 화면은 날씨 타일을 뺀다
 * @see https://open-meteo.com/en/docs/historical-weather-api
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const month = Number(params.get("month"));
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "달을 확인해 주세요" }, { status: 400 });
  }
  try {
    const coords = await cityCoords(params);
    if (!coords) return NextResponse.json({ error: "도시를 확인해 주세요" }, { status: 404 });
    const normals = await monthNormals(coords, month);
    if (!normals)
      return NextResponse.json({ error: "평년 기온을 가져오지 못했어요" }, { status: 502 });
    return NextResponse.json(normals, {
      headers: { "Cache-Control": "private, max-age=86400" },
    });
  } catch (e) {
    console.error("weather-normals", e);
    return NextResponse.json({ error: "평년 기온을 가져오지 못했어요" }, { status: 502 });
  }
}
