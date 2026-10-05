import { createClient } from "@/shared/api/supabase/client";

/** 일정 편집 「완료」 에 저장할 것 */
export type ScheduleEdit = {
  /** 손댄 날마다 새 순서(일정 id, 다른 날에서 옮겨 온 것 포함) */
  days: Record<number, string[]>;
  /** 지울 일정 */
  deletes: string[];
  /** 바꾼 날의 하루 요약. 빈 글이면 그날 요약을 지운다 */
  summaries: Record<number, string>;
};

/** 일정 편집 「완료」 — 순서 · 날짜 이동 · 지우기 · 하루 요약을 한 번에 저장한다(0031 apply_schedule_edit, 한 트랜잭션) */
export async function applyScheduleEdit(tripId: string, edit: ScheduleEdit): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("apply_schedule_edit", {
    p_trip: tripId,
    p_days: edit.days,
    p_deletes: edit.deletes,
    p_summaries: edit.summaries,
  });
  if (error) throw error;
}
