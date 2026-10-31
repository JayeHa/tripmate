import { createClient } from "@/shared/api/supabase/client";

/** 비용 입력에서 고른 장소의 칸 — 구글 장소 검색 결과 */
export type MyPlaceFields = {
  name: string;
  google_place_id: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  category: string | null;
  gmap_url: string | null;
};

/**
 * 내 장소로 만든다(이미 가진 구글 장소면 적은 칸만 고쳐 쓴다, `upsert_my_place`). 일정 · 보관함에는 넣지 않는다 — 비용의 장소(#289).
 * 도시는 좌표로 여행의 도시 중에서 정한다. 장소 id 를 돌려준다
 */
export async function upsertMyPlace(tripId: string, place: MyPlaceFields): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("upsert_my_place", { p_trip: tripId, p_place: place });
  if (error) throw error;
  return data;
}
