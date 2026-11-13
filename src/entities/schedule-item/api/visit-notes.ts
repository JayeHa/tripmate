import { createClient } from "@/shared/api/supabase/client";

import type { VisitNote } from "../model/visit-note";

/** 여행의 기록 글 전부 — 일정마다 하나, 일행이 함께 쓴다 */
export async function fetchVisitNotes(tripId: string): Promise<VisitNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("visit_notes").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data;
}

/**
 * 일정 하나의 기록 글을 올린다 — 오프라인 대기열로 올라온다. body 가 비면 지운다.
 * 고친 사람은 DB 가 나로 채운다(사람 id 를 보내지 않는다). 두 번 올라가도 결과가 같다.
 * at = 저장한 시각(오프라인에서 저장한 때), seen = 고치기 시작할 때 본 글의 updated_at(글이 없었으면 null).
 * 그사이 일행이 고친 글을 덮었으면(지웠으면) true — 나중 저장이 이기고, 부른 쪽이 알린다
 */
export async function saveVisitNote(v: {
  itemId: string;
  body: string;
  at: string;
  seen: string | null;
}): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_visit_note", {
    p_item: v.itemId,
    p_body: v.body,
    p_at: v.at,
    p_seen: v.seen,
  });
  if (error) throw error;
  return data;
}
