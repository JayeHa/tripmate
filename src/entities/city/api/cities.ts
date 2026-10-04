import { createClient } from "@/shared/api/supabase/client";

import type { City, CityCatalog } from "../model/types";

/** 권역과 도시를 화면 순서대로 읽는다. 105행 정도라 한 번에 받는다. */
export async function fetchCityCatalog(): Promise<CityCatalog> {
  const supabase = createClient();
  const [regions, cities] = await Promise.all([
    supabase.from("city_regions").select("*").order("position"),
    supabase.from("cities").select("*").order("position"),
  ]);
  if (regions.error) throw regions.error;
  if (cities.error) throw cities.error;
  return { regions: regions.data, cities: cities.data };
}

type TripCityRow = { position: number; city: City };

/** 여행이 고른 도시를 순서대로. 지도 중심 · 국가 코드가 함께 온다(장소 검색 범위) */
export async function fetchTripCities(tripId: string): Promise<City[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_cities")
    .select("position, city:cities(*)")
    .eq("trip_id", tripId);
  if (error) throw error;
  // database.types.ts 가 수기 작성이라 별칭 임베드의 타입이 없다. 그 부분만 좁게 단언한다.
  const rows = data as unknown as TripCityRow[];
  return [...rows].sort((a, b) => a.position - b.position).map((r) => r.city);
}
