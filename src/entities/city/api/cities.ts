import { createClient } from "@/shared/api/supabase/client";
import type { CityCatalog } from "../model/types";

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
