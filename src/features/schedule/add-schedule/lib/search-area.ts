import type { City } from "@/entities/city";

/**
 * 검색 영역의 반폭(도). 도시 중심에서 위아래 · 좌우로 이만큼(약 100km)인 사각형 안만 찾는다.
 * 도쿄면 하코네(도쿄역에서 약 80km)까지 들어온다. 써 보고 좁거나 넓으면 이 값만 바꾼다(docs/policies/place-search.md).
 */
export const SEARCH_HALF_SPAN_DEG = 1;

type LatLng = { lat: number; lng: number };

/**
 * 구글 장소 자동완성을 이 도시 근처로 「제한」하는 조건. bias(먼저 보여 줌)가 아니라 restriction(그 밖은 빼기)이다.
 * 나라(`includedRegionCodes`)와 사각형(`locationRestriction`)을 함께 걸면 둘 다 만족하는 결과만 온다.
 * 여러 도시 여행이어도 사각형 하나로 여러 도시를 덮지 않는다 — 사이 지역이 섞인다. 도시 칩으로 하나를 고른다.
 */
export function searchArea(city: Pick<City, "lat" | "lng" | "country_code">) {
  return {
    includedRegionCodes: [city.country_code.toLowerCase()],
    locationRestriction: {
      north: city.lat + SEARCH_HALF_SPAN_DEG,
      south: city.lat - SEARCH_HALF_SPAN_DEG,
      east: city.lng + SEARCH_HALF_SPAN_DEG,
      west: city.lng - SEARCH_HALF_SPAN_DEG,
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
