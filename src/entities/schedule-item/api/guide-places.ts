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

/**
 * 보관함에서 빼기 — 보관함 줄만 지운다(메모 포함, 장소 · 일정은 그대로).
 * 이 여행 일정(대체 장소 포함)에 있는 장소는 DB 가 0행으로 막는다(0068) — 그때 오류로 알린다
 */
export async function removeGuidePlace(tripId: string, placeId: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_places")
    .delete()
    .eq("trip_id", tripId)
    .eq("place_id", placeId)
    .select("place_id");
  if (error) throw error;
  if (data.length === 0) throw new Error("일정에 있는 장소는 일정에서 먼저 지워 주세요");
}

/** 이 여행에서 이 장소에 대한 메모 — 비우면 지운다(null). 일행 누구나 고친다 */
export async function setGuideMemo(tripId: string, placeId: string, memo: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_places")
    .update({ memo: memo.trim() || null })
    .eq("trip_id", tripId)
    .eq("place_id", placeId)
    .select("place_id");
  if (error) throw error;
  if (data.length === 0) throw new Error("보관함에서 빠진 장소예요");
}
