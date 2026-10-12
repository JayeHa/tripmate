import { createClient } from "@/shared/api/supabase/client";

import type { Flight, FlightFieldsInput, FlightSaveResult } from "../model/types";

/** 여행의 항공편 — 출발 순 */
export async function fetchFlights(tripId: string): Promise<Flight[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .eq("trip_id", tripId)
    .order("dep_date")
    .order("dep_time")
    .order("created_at");
  if (error) throw error;
  return data;
}

/**
 * 항공편 저장(save_flight, 0052) — 항공편과 탑승일의 일정 카드를 한 트랜잭션으로. flightId 가 null 이면 새 항공편.
 * 탑승일이 여행 기간 밖이면 카드가 없고, 고쳐서 밖으로 나가면 카드(메모 포함)를 지운다
 */
export async function saveFlight(
  tripId: string,
  flightId: string | null,
  fields: FlightFieldsInput,
): Promise<FlightSaveResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_flight", {
    p_trip: tripId,
    p_flight: flightId,
    p_fields: fields,
  });
  if (error) throw error;
  return data as FlightSaveResult;
}

/**
 * 항공편 지우기 — 일정 카드(와 메모)도 함께 지워진다(cascade).
 * 0행이면(그사이 지워졌거나 권한이 없다 — RLS 는 오류 없이 0행으로 끝난다) 던진다
 */
export async function deleteFlight(flightId: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("flights").delete().eq("id", flightId).select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error("이미 지워진 항공편이에요");
}
