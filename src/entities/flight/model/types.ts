import type { Tables } from "@/shared/api/supabase/database.types";

/** 항공편 한 줄 */
export type Flight = Tables<"flights">;

/** 항공편 저장에 보내는 값 — save_flight 의 p_fields. 시각은 「HH:MM」, arr_date 가 비면 출발일 */
export type FlightFieldsInput = {
  airline_name: string;
  airline_code: string;
  flight_no: string;
  dep_airport: string;
  arr_airport: string;
  dep_date: string;
  dep_time: string;
  arr_date: string;
  arr_time: string;
  status: string | null;
  booking_ref: string | null;
};

/** 이번 저장으로 일정 카드가 어떻게 됐는지 — 새로 생김 · 다른 날로 옮김 · 지움(기간 밖), 그대로면 null */
export type FlightCardChange = "added" | "moved" | "removed" | null;

/** save_flight 가 돌려주는 것 */
export type FlightSaveResult = { id: string; card: FlightCardChange };
