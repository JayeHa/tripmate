import { createClient } from "@/shared/api/supabase/client";

import type { Stay, StayFieldsInput, StayPlaceInput, StaySaveResult } from "../model/types";

/** 여행의 숙소 — 체크인 순. 장소를 함께 읽는다 */
export async function fetchStays(tripId: string): Promise<Stay[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stays")
    .select("*, place:places!inner(*)")
    .eq("trip_id", tripId)
    .order("check_in_date")
    .order("created_at");
  if (error) throw error;
  return data;
}

/**
 * 숙소 저장(save_stay, 0046) — 장소 · 숙소 · 묵는 날의 연결 카드를 한 트랜잭션으로.
 * stayId 가 null 이면 새 숙소. prune 이면 기간이 줄어 밀려난 연결 카드를 지운다
 */
export async function saveStay(
  tripId: string,
  stayId: string | null,
  place: StayPlaceInput,
  fields: StayFieldsInput,
  prune: boolean,
): Promise<StaySaveResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_stay", {
    p_trip: tripId,
    p_stay: stayId,
    p_place: place,
    p_fields: fields,
    p_prune: prune,
  });
  if (error) throw error;
  return data as StaySaveResult;
}

/** 숙소 지우기(delete_stay). deleteCards 면 연결 카드도 지우고, 아니면 일반 장소 카드로 남긴다. 지운 카드 수 */
export async function deleteStay(stayId: string, deleteCards: boolean): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("delete_stay", {
    p_stay: stayId,
    p_delete_cards: deleteCards,
  });
  if (error) throw error;
  return data;
}

/** 예약 상태만 바로 바꾼다 — 연결 카드는 트리거가 맞춘다 */
export async function updateStayStatus(stayId: string, status: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("stays").update({ status }).eq("id", stayId);
  if (error) throw error;
}
