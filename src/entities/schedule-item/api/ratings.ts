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
 * 내 별점 하나를 올린다 — 오프라인 대기열로 올라온다. stars 가 0 이면 지운다.
 * 매긴 사람은 DB 기본값이 나로 채우고, 지우기도 RLS 가 내 줄만 남긴다 — 그래서 사람 id 를 보내지 않는다.
 * 일정 × 나가 키라 두 번 올라가도 결과가 같다. at = 누른 시각(오프라인에서 누른 때)
 */
export async function saveRating(v: {
  tripId: string;
  itemId: string;
  stars: number;
  at: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } =
    v.stars > 0
      ? await supabase
          .from("place_ratings")
          .upsert(
            { item_id: v.itemId, trip_id: v.tripId, stars: v.stars, rated_at: v.at },
            { onConflict: "item_id,user_id" },
          )
      : await supabase.from("place_ratings").delete().eq("item_id", v.itemId);
  if (error) throw error;
}
