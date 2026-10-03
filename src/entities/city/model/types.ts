import type { Tables } from "@/shared/api/supabase/database.types";

export type City = Tables<"cities">;
export type CityRegion = Tables<"city_regions">;
export type CityScope = City["scope"];

/** 도시 선택 화면이 한 번에 받는 기준 데이터 전체. */
export type CityCatalog = { regions: CityRegion[]; cities: City[] };
