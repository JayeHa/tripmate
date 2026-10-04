import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import type { DayRoute, RouteLeg, TravelMode } from "@/entities/schedule-item";
// server-only 라 배럴에 없다. full path 로만 참조한다 (AGENTS.md 배럴)
// eslint-disable-next-line no-restricted-imports
import { computeDayRoute, type RoutePoint } from "@/entities/schedule-item/api/compute-day-route";
// 배럴은 클라이언트 UI 까지 끌고 와서, 순수 판정 함수만 full path 로 가져온다
// eslint-disable-next-line no-restricted-imports
import { isMappedPlace, itemCoords } from "@/entities/schedule-item/model/place";
import { createClient } from "@/shared/api/supabase/server";

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
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS 덕분에 멤버가 아니면 빈 배열
  const { data: items, error } = await supabase
    .from("schedule_items")
    .select("id, kind, place:places(lat, lng)")
    .eq("trip_id", tripId)
    .eq("day_index", dayIndex)
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
  if (!apiKey)
    return NextResponse.json({ error: "GOOGLE_MAPS_SERVER_KEY 미설정" }, { status: 500 });

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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "경로 계산 실패" },
      { status: 502 },
    );
  }
}
