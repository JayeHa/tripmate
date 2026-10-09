import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import type { DayRoute, RouteLeg, TravelMode } from "@/entities/schedule-item";
// server-only 라 배럴에 없다. full path 로만 참조한다 (AGENTS.md 배럴)
// eslint-disable-next-line no-restricted-imports
import { computeDayRoute, type RoutePoint } from "@/entities/schedule-item/api/compute-day-route";
// 배럴은 클라이언트 UI 까지 끌고 와서, 순수 판정 함수만 full path 로 가져온다
// eslint-disable-next-line no-restricted-imports
import { isMappedPlace, itemCoords } from "@/entities/schedule-item/model/place";
import { routeError } from "@/shared/api/route-error";
import { createClient } from "@/shared/api/supabase/server";

/** 예상하지 못한 실패 때 화면에 보낼 문구 — 원인은 서버 로그에만 */
const FAILED = "경로를 가져오지 못했어요";

type Body = { tripId?: string; dayIndex?: number; travelMode?: TravelMode };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const { tripId, dayIndex } = body;
  const travelMode: TravelMode = body.travelMode === "TRANSIT" ? "TRANSIT" : "WALK";
  if (!tripId || typeof dayIndex !== "number") {
    return NextResponse.json({ error: "tripId, dayIndex 필요" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  // RLS 덕분에 멤버가 아니면 빈 배열. 대체 장소 줄은 동선이 아니라 뺀다
  const { data: items, error } = await supabase
    .from("schedule_items")
    .select("id, kind, place:places(lat, lng)")
    .eq("trip_id", tripId)
    .eq("day_index", dayIndex)
    .is("alternative_of", null)
    .order("position");
  if (error) return routeError(error, FAILED);

  const points: RoutePoint[] = (items ?? [])
    // 지도 핀과 같은 기준. 좌표가 있어도 flight · move 는 경유점이 아니다
    .flatMap((it) => {
      const at = isMappedPlace(it) ? itemCoords(it) : null;
      return at ? [{ id: it.id, ...at }] : [];
    });

  if (points.length < 2) {
    return NextResponse.json({ polyline: null, legs: [] } satisfies DayRoute);
  }

  const itemsHash = createHash("md5")
    .update(points.map((p) => p.id).join("|"))
    .digest("hex");

  const { data: cached } = await supabase
    .from("day_routes")
    .select("items_hash, polyline, legs")
    .eq("trip_id", tripId)
    .eq("day_index", dayIndex)
    .eq("travel_mode", travelMode)
    .maybeSingle();

  if (cached && cached.items_hash === itemsHash) {
    return NextResponse.json({
      polyline: cached.polyline || null,
      legs: cached.legs as RouteLeg[],
    } satisfies DayRoute);
  }

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!apiKey) return routeError(new Error("GOOGLE_MAPS_SERVER_KEY 미설정"), FAILED);

  try {
    const { polyline, legs } = await computeDayRoute(points, travelMode, apiKey);
    await supabase.from("day_routes").upsert({
      trip_id: tripId,
      day_index: dayIndex,
      travel_mode: travelMode,
      items_hash: itemsHash,
      polyline,
      legs,
      computed_at: new Date().toISOString(),
    });
    return NextResponse.json({ polyline: polyline || null, legs } satisfies DayRoute);
  } catch (e) {
    return routeError(e, FAILED, 502);
  }
}
