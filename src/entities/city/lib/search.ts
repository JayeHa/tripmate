import type { City, CityRegion, CityScope } from "../model/types";

/**
 * 이름이나 포함 지역에 검색어가 들어 있는 도시. 「하코네」로 찾으면 도쿄가 나온다.
 * 공백은 무시한다(「코 사멧」 = 「코사멧」).
 */
export function searchCities(cities: readonly City[], query: string) {
  const q = squash(query);
  if (!q) return [...cities];
  return cities.filter((c) => [c.name, ...c.areas].some((s) => squash(s).includes(q)));
}

/** 도시 선택 화면의 권역 칩 순서대로 묶는다. 국내는 권역이 없어 하나로 묶인다. */
export function groupByRegion(
  regions: readonly CityRegion[],
  cities: readonly City[],
  scope: CityScope,
) {
  const inScope = cities.filter((c) => c.scope === scope);
  if (scope === "domestic") return [{ region: null, cities: inScope }];
  return regions
    .map((region) => ({ region, cities: inScope.filter((c) => c.region_id === region.id) }))
    .filter((group) => group.cities.length > 0);
}

/** 도시 행의 회색 부제. 국내 「어디론가」처럼 포함 지역 대신 설명이 있는 도시도 있다. */
export function cityAreasLabel(city: Pick<City, "areas" | "description">) {
  return city.description ?? city.areas.join(", ");
}

function squash(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}
