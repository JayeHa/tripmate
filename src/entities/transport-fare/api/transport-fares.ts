import { createClient } from "@/shared/api/supabase/client";

import type { FareDraft, TransportFare } from "../model/types";

/** 고치려는 줄이 없다 — 그사이 일행이 지웠다 */
export const FARE_GONE = "이미 지워진 교통비예요";

/** 여행의 교통비 — 날짜 줄은 날짜 순, 날짜 밖 줄은 넣은 순 */
export async function fetchTransportFares(tripId: string): Promise<TransportFare[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transport_fares")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_index", { nullsFirst: false })
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 그날 줄을 넣거나 고친다(날짜마다 한 줄) — 일행이 먼저 만들었어도 같은 줄을 덮는다 */
export async function saveDayFare(tripId: string, dayIndex: number, draft: FareDraft) {
  const supabase = createClient();
  const { error } = await supabase
    .from("transport_fares")
    .upsert(
      { trip_id: tripId, day_index: dayIndex, ...draft },
      { onConflict: "trip_id,day_index" },
    );
  if (error) throw error;
}

/** 그날 줄을 지운다(금액 · 메모를 모두 비웠을 때). 이미 없으면 그대로 끝낸다 */
export async function clearDayFare(tripId: string, dayIndex: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("transport_fares")
    .delete()
    .eq("trip_id", tripId)
    .eq("day_index", dayIndex);
  if (error) throw error;
}

/** 날짜 밖 줄(공항 왕복 · 패스)을 넣는다 */
export async function addExtraFare(tripId: string, title: string, draft: FareDraft) {
  const supabase = createClient();
  const { error } = await supabase
    .from("transport_fares")
    .insert({ trip_id: tripId, title: title.trim(), ...draft });
  if (error) throw error;
}

/** 날짜 밖 줄을 고친다 — 0행이면(그사이 지웠다) FARE_GONE */
export async function updateExtraFare(id: string, title: string, draft: FareDraft) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transport_fares")
    .update({ title: title.trim(), ...draft })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(FARE_GONE);
}

/** 줄을 지운다. 이미 없으면 그대로 끝낸다 */
export async function deleteFare(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("transport_fares").delete().eq("id", id);
  if (error) throw error;
}

/** 여행의 교통카드 · 패스 메모 — 비우면 null. 0행이면(여행이 지워졌거나 나갔다) 던진다 */
export async function saveTransportNote(tripId: string, note: string | null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ transport_note: note })
    .eq("id", tripId)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error("여행을 찾을 수 없어요");
}
