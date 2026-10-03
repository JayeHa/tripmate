import "server-only";
import { decode, encode } from "@googlemaps/polyline-codec";
import type { RouteLeg, TravelMode } from "../model/types";

export type RoutePoint = { id: string; lat: number; lng: number };

type RoutesResponse = {
  routes?: {
    polyline?: { encodedPolyline?: string };
    legs?: { duration?: string; distanceMeters?: number }[];
  }[];
  error?: { message?: string };
};

const ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK =
  "routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters";

function waypoint(p: RoutePoint) {
  return { location: { latLng: { latitude: p.lat, longitude: p.lng } } };
}

function parseDuration(d?: string): number {
  return d ? Number(d.replace(/s$/, "")) || 0 : 0;
}

async function callRoutes(body: Record<string, unknown>, apiKey: string): Promise<RoutesResponse> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as RoutesResponse;
  if (!res.ok) throw new Error(json.error?.message ?? `Routes API ${res.status}`);
  return json;
}

/**
 * 연속된 지점들의 경로를 계산.
 * WALK: intermediates 로 1회 호출. TRANSIT: intermediates 미지원이라 구간별 호출 후 이어붙임.
 */
export async function computeDayRoute(
  points: RoutePoint[],
  mode: TravelMode,
  apiKey: string,
): Promise<{ polyline: string; legs: RouteLeg[] }> {
  if (points.length < 2) return { polyline: "", legs: [] };

  if (mode === "WALK") {
    const json = await callRoutes(
      {
        origin: waypoint(points[0]),
        destination: waypoint(points[points.length - 1]),
        intermediates: points.slice(1, -1).map(waypoint),
        travelMode: "WALK",
        languageCode: "ko",
        units: "METRIC",
      },
      apiKey,
    );
    const route = json.routes?.[0];
    const legs = (route?.legs ?? []).map((leg, i) => ({
      fromId: points[i].id,
      toId: points[i + 1].id,
      durationSec: parseDuration(leg.duration),
      distanceM: leg.distanceMeters ?? 0,
    }));
    return { polyline: route?.polyline?.encodedPolyline ?? "", legs };
  }

  // TRANSIT: 구간별
  const results = await Promise.all(
    points.slice(0, -1).map((from, i) =>
      callRoutes(
        {
          origin: waypoint(from),
          destination: waypoint(points[i + 1]),
          travelMode: "TRANSIT",
          languageCode: "ko",
          units: "METRIC",
        },
        apiKey,
      ).catch(() => null),
    ),
  );

  const path: [number, number][] = [];
  const legs: RouteLeg[] = [];
  results.forEach((json, i) => {
    const route = json?.routes?.[0];
    const from = points[i];
    const to = points[i + 1];
    if (route?.polyline?.encodedPolyline) {
      path.push(...decode(route.polyline.encodedPolyline));
    } else {
      // 대중교통 경로가 없으면 직선으로 연결
      path.push([from.lat, from.lng], [to.lat, to.lng]);
    }
    const leg = route?.legs?.[0];
    legs.push({
      fromId: from.id,
      toId: to.id,
      durationSec: parseDuration(leg?.duration),
      distanceM: leg?.distanceMeters ?? 0,
    });
  });
  return { polyline: path.length ? encode(path) : "", legs };
}
