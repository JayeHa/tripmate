import type { City } from "@/entities/city";

type LatLng = { lat: number; lng: number };

/**
 * 도시 지도 줌(`cities.zoom`)에 따른 검색 사각형의 반폭(도). 도시 중심에서 위아래 · 좌우로 이만큼 안만 찾는다.
 * - 줌 11 이상(도시): 1° — 약 100km. 도쿄면 하코네(약 80km)까지 들어오고 오사카는 빠진다
 * - 줌 10(넓은 도시권): 2°
 * - 줌 9 이하(나라 · 섬 무리 — 하와이 · 오키나와 · 미얀마 · 「국내 어디론가」): null — 사각형을 걸지 않는다.
 *   중심에서 ±몇 도로는 포함 지역(마우이 · 이시가키 · 바간 · 부산 · 제주)이 빠진다
 * 써 보고 좁거나 넓으면 이 값만 바꾼다(docs/policies/place-search.md).
 */
export function searchHalfSpan(zoom: number): number | null {
  if (zoom >= 11) return 1;
  if (zoom === 10) return 2;
  return null;
}

/** 사각형을 걸지 않는 도시에서 중심 쪽 결과를 먼저 보이는 반경(m) — 제한이 아니라 우선순위 */
const WIDE_BIAS_RADIUS_M = 50_000;

/**
 * 구글 장소 자동완성을 이 도시 근처로 「제한」하는 조건. 나라(`includedRegionCodes`)는 늘 걸고,
 * 사각형(`locationRestriction`, bias 가 아니라 그 밖은 빼기)은 도시 단위일 때만 건다. 둘 다 만족하는 결과만 온다.
 * 나라 · 섬 무리 단위 도시는 사각형 대신 중심 쪽을 먼저 보이는 bias 만 건다.
 * 여러 도시 여행이어도 사각형 하나로 여러 도시를 덮지 않는다 — 사이 지역이 섞인다. 도시 칩으로 하나를 고른다.
 */
export function searchArea(city: Pick<City, "lat" | "lng" | "country_code" | "zoom">) {
  const includedRegionCodes = [city.country_code.toLowerCase()];
  const half = searchHalfSpan(city.zoom);
  if (half === null) {
    return {
      includedRegionCodes,
      locationBias: { center: { lat: city.lat, lng: city.lng }, radius: WIDE_BIAS_RADIUS_M },
    };
  }
  return {
    includedRegionCodes,
    locationRestriction: {
      north: city.lat + half,
      south: city.lat - half,
      east: city.lng + half,
      west: city.lng - half,
    },
  };
}

/**
 * 처음 고를 도시. 그날 첫 장소에서 가장 가까운 여행 도시, 그날 장소가 없으면 첫 도시. 도시가 없으면 null.
 * 대부분 날짜별로 한 도시에 있어서 이 값이 맞는 경우가 많다.
 */
export function defaultCityId(cities: City[], dayAnchor: LatLng | null): string | null {
  if (cities.length === 0) return null;
  if (!dayAnchor) return cities[0].id;
  let best = cities[0];
  for (const c of cities) {
    if (distance2(c, dayAnchor) < distance2(best, dayAnchor)) best = c;
  }
  return best.id;
}

/** 경도를 위도로 보정한 거리 제곱. 가까운 것 고르기용 */
function distance2(a: LatLng, b: LatLng) {
  const dx = (a.lng - b.lng) * Math.cos((b.lat * Math.PI) / 180);
  return (a.lat - b.lat) ** 2 + dx ** 2;
}
