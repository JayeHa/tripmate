import { createClient } from "@/shared/api/supabase/client";

import type { PlaceRating } from "../model/rating";

/** 여행의 별점 전부(일행 것까지) */
export async function fetchRatings(tripId: string): Promise<PlaceRating[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("place_ratings").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data;
}

/**
 * 일정 하나에서 그 장소의 내 별점을 올린다 — 오프라인 대기열로 올라온다. stars 가 0 이면 지운다.
 * 장소키는 DB(rate_place)가 일정에서 구하고, 매긴 사람은 나로 채운다 — 그래서 장소키 · 사람 id 를 보내지 않는다.
 * 여행의 장소 × 나가 키라 두 번 올라가도 결과가 같다. at = 누른 시각(오프라인에서 누른 때)
 */
export async function saveRating(v: {
  tripId: string;
  itemId: string;
  stars: number;
  at: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("rate_place", {
    p_item: v.itemId,
    p_stars: v.stars,
    p_at: v.at,
  });
  if (error) throw error;
}
