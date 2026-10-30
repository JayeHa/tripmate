import { createClient } from "@/shared/api/supabase/client";

import type { Place } from "../model/types";

/** 가이드 보관함의 장소 한 곳 — 장소와, 이 여행에서 담은 사람 · 메모 · 담은 시각 */
export type GuidePlace = {
  place: Place;
  addedBy: string | null;
  memo: string | null;
  addedAt: string;
};

/**
 * 여행 가이드 보관함 — 일행이 모은 장소 전부(일정에 넣은 장소 포함, 0067). 최근에 담은 것부터.
 * 장소를 읽을 수 없는 줄(권한이 바뀐 사이)은 빼고 돌려준다
 */
export async function fetchGuidePlaces(tripId: string): Promise<GuidePlace[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_places")
    .select("added_by, memo, created_at, place:places(*)")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.flatMap((row) =>
    row.place
      ? [{ place: row.place, addedBy: row.added_by, memo: row.memo, addedAt: row.created_at }]
      : [],
  );
}
