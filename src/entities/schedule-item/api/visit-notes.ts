import { createClient } from "@/shared/api/supabase/client";

import type { VisitNote } from "../model/visit-note";

/** 여행의 기록 글 전부(일행 것까지) */
export async function fetchVisitNotes(tripId: string): Promise<VisitNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("visit_notes").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data;
}

/**
 * 내 기록 글 하나를 올린다 — 오프라인 대기열로 올라온다. body 가 비면 지운다.
 * 쓴 사람은 DB 기본값이 나로 채우고, 지우기도 RLS 가 내 줄만 남긴다 — 그래서 사람 id 를 보내지 않는다(별점과 같다).
 * 일정 × 나가 키라 두 번 올라가도 결과가 같다. at = 저장한 시각(오프라인에서 저장한 때)
 */
export async function saveVisitNote(v: {
  tripId: string;
  itemId: string;
  body: string;
  at: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = v.body
    ? await supabase
        .from("visit_notes")
        .upsert(
          { item_id: v.itemId, trip_id: v.tripId, body: v.body, updated_at: v.at },
          { onConflict: "item_id,user_id" },
        )
    : await supabase.from("visit_notes").delete().eq("item_id", v.itemId);
  if (error) throw error;
}
