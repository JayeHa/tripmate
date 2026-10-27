import { type NextRequest, NextResponse } from "next/server";

import { publicHolidays } from "@/shared/lib/country-holidays.server";

/**
 * 여행지 국가의 공휴일 — `?country=JP&year=2026`. 데이터는 배포에 들어 있어 배포 사이에는 바뀌지 않으므로
 * 브라우저는 하루, Vercel 은 30일 동안 같은 응답을 다시 쓴다(새 배포는 Vercel 의 저장분을 비운다)
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const country = params.get("country") ?? "";
  const year = Number(params.get("year"));
  if (!/^[A-Z]{2}$/.test(country) || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "나라 · 해를 확인해 주세요" }, { status: 400 });
  }
  return NextResponse.json(publicHolidays(country, year), {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" },
  });
}
