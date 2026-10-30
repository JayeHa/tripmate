import type { Tables } from "@/shared/api/supabase/database.types";

export type City = Tables<"cities">;
export type CityRegion = Tables<"city_regions">;
/** 도시의 지역(긴자 · 시부야 …) — 홈 가이드 지역 필터 · 장소의 지역(0070) */
export type CityArea = Tables<"city_areas">;
export type CityScope = City["scope"];

/** 도시 선택 화면이 한 번에 받는 기준 데이터 전체. */
export type CityCatalog = { regions: CityRegion[]; cities: City[] };
