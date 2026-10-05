import { createClient } from "@/shared/api/supabase/client";

/**
 * 일정 편집 「완료」 — 손댄 날마다 새 순서(일정 id, 다른 날에서 옮겨 온 것 포함)와 지울 일정을 한 번에 저장한다
 * (0030 apply_schedule_edit, 한 트랜잭션)
 */
export async function applyScheduleEdit(
  tripId: string,
  days: Record<number, string[]>,
  deletes: string[],
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("apply_schedule_edit", {
    p_trip: tripId,
    p_days: days,
    p_deletes: deletes,
  });
  if (error) throw error;
}
