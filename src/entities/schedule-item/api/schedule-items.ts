import { createClient } from "@/shared/api/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/shared/api/supabase/database.types";

import type { ScheduleItem } from "../model/types";

export async function fetchScheduleItems(tripId: string): Promise<ScheduleItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_index")
    .order("position");
  if (error) throw error;
  return data;
}

export type NewScheduleItem = Omit<TablesInsert<"schedule_items">, "position"> & {
  position?: number;
};

/** 해당 날의 마지막 position + 1 로 추가 */
export async function createScheduleItem(input: NewScheduleItem): Promise<ScheduleItem> {
  const supabase = createClient();
  const { data: last } = await supabase
    .from("schedule_items")
    .select("position")
    .eq("trip_id", input.trip_id)
    .eq("day_index", input.day_index)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("schedule_items")
    .insert({ ...input, position: input.position ?? (last ? last.position + 1 : 0) })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateScheduleItem(
  id: string,
  patch: TablesUpdate<"schedule_items">,
): Promise<ScheduleItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScheduleItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("schedule_items").delete().eq("id", id);
  if (error) throw error;
}

/** 두 아이템의 position 을 서로 바꿈 (위/아래 이동) */
export async function swapScheduleItems(a: ScheduleItem, b: ScheduleItem): Promise<void> {
  const supabase = createClient();
  const [ra, rb] = await Promise.all([
    supabase.from("schedule_items").update({ position: b.position }).eq("id", a.id),
    supabase.from("schedule_items").update({ position: a.position }).eq("id", b.id),
  ]);
  if (ra.error) throw ra.error;
  if (rb.error) throw rb.error;
}

/** 다른 날로 이동: 대상 날의 맨 끝으로 */
export async function moveScheduleItemToDay(
  item: ScheduleItem,
  dayIndex: number,
): Promise<ScheduleItem> {
  const supabase = createClient();
  const { data: last } = await supabase
    .from("schedule_items")
    .select("position")
    .eq("trip_id", item.trip_id)
    .eq("day_index", dayIndex)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return updateScheduleItem(item.id, {
    day_index: dayIndex,
    position: last ? last.position + 1 : 0,
  });
}
