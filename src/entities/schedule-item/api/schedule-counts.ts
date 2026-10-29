import { createClient } from "@/shared/api/supabase/client";

/** dayIndex 일째부터 끝까지의 일정 수(대체 장소 빼고). 기간을 줄일 때 옮겨질 일정을 미리 센다 */
export async function countScheduleItemsFrom(tripId: string, dayIndex: number): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("schedule_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .is("alternative_of", null)
    .gte("day_index", dayIndex);
  if (error) throw error;
  return count ?? 0;
}

/**
 * 이 도시들에 있는 장소를 쓰는 일정 수를 도시별로(대체 장소 빼고). 여행 도시에서 뺄 때 남는 일정을 미리 센다.
 * 일정이 없는 도시는 키가 없다
 */
export async function countScheduleItemsByCity(
  tripId: string,
  cityIds: string[],
): Promise<Record<string, number>> {
  if (cityIds.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_items")
    .select("place:places!inner(city_id)")
    .eq("trip_id", tripId)
    .is("alternative_of", null)
    .in("place.city_id", cityIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const { place } of data) counts[place.city_id] = (counts[place.city_id] ?? 0) + 1;
  return counts;
}
