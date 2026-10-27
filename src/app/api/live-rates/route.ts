import { type NextRequest, NextResponse } from "next/server";

import { CURRENCIES, currencyInfo, parseLiveRates } from "@/shared/lib/money";

/** ExchangeRate-API 무료 주소(키 없음 · 하루 한 번 갱신 · 저장 허용, 화면에 출처 링크 필요) */
const SOURCE = "https://open.er-api.com/v6/latest";
/** 서버가 받은 응답을 다시 쓰는 시간(초) — 하루 한 번 갱신되는 데이터라 반나절이면 충분하다 */
const REVALIDATE = 43_200;
const KNOWN = CURRENCIES.map((c) => c.code);

/**
 * 실시간 환율 — `?base=KRW`. 앱이 아는 통화만 우리 모양(LiveRates)으로 돌려준다.
 * 바깥 서비스는 서버가 반나절에 한 번만 부른다(무료 범위 · 화면마다 부르지 않게). 실패하면 502 — 화면은 「지금」 값을 빼고 그린다
 * @see https://www.exchangerate-api.com/docs/free
 */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.searchParams.get("base") ?? "";
  if (!currencyInfo(base)) {
    return NextResponse.json({ error: "모르는 기준 통화예요" }, { status: 400 });
  }
  try {
    const res = await fetch(`${SOURCE}/${base}`, { next: { revalidate: REVALIDATE } });
    const live = res.ok ? parseLiveRates(await res.json(), base, KNOWN) : null;
    if (!live) return NextResponse.json({ error: "환율을 가져오지 못했어요" }, { status: 502 });
    return NextResponse.json(live);
  } catch (e) {
    console.error("live-rates", e);
    return NextResponse.json({ error: "환율을 가져오지 못했어요" }, { status: 502 });
  }
}
