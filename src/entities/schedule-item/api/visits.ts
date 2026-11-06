import { createClient } from "@/shared/api/supabase/client";

import type { Visit, VisitMark } from "../model/visit";

/** 여행의 다녀감 표시 전부 */
export async function fetchVisits(tripId: string): Promise<Visit[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("schedule_visits").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data as Visit[];
}

/**
 * 일정 하나의 표시를 올린다 — 오프라인 대기열로 올라온다. mark 가 null 이면 지운다.
 * 일정 id 가 키라 두 번 올라가도 결과가 같다. 그사이 일행이 바꿨으면 나중에 올라간 쪽이 남는다.
 * 누른 사람은 DB 트리거가 나로 채운다. at = 누른 시각(오프라인에서 누른 때)
 */
export async function saveVisit(v: {
  tripId: string;
  itemId: string;
  mark: VisitMark | null;
  at: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = v.mark
    ? await supabase
        .from("schedule_visits")
        .upsert({ item_id: v.itemId, trip_id: v.tripId, mark: v.mark, marked_at: v.at })
    : await supabase.from("schedule_visits").delete().eq("item_id", v.itemId);
  if (error) throw error;
}
