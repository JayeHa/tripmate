import { createClient } from "@/shared/api/supabase/client";
import type { Tables } from "@/shared/api/supabase/database.types";
import type { ExchangeRates } from "@/shared/lib/money";

import type { TripFormValues } from "../model/schema";
import type { Trip } from "../model/types";

function toTrip(row: Tables<"trips">): Trip {
  return { ...row, exchange_rates: (row.exchange_rates ?? {}) as ExchangeRates };
}

export function ratesFromForm(rates: TripFormValues["rates"]): ExchangeRates {
  return Object.fromEntries(rates.map((r) => [r.currency, { unit: r.unit, value: r.value }]));
}

export function ratesToForm(rates: ExchangeRates): TripFormValues["rates"] {
  return Object.entries(rates).map(([currency, r]) => ({ currency, unit: r.unit, value: r.value }));
}

/** 목록에 보이는 도시. 사진이 있는 첫 도시가 여행 썸네일이 된다. */
export type TripCity = { id: string; name: string };

/**
 * 목록에서 「N명과 함께」·「N개 도시」를 보여주려고 멤버 수와 도시를 함께 읽는다.
 * IndexedDB 에 저장되는 데이터다. 이 파일이 바뀌면 저장된 캐시는 버려진다(query-cache.config.mjs).
 */
export type TripListItem = Trip & { companionCount: number; cities: TripCity[] };

type TripListRow = Tables<"trips"> & {
  trip_members: { count: number }[];
  trip_cities: { position: number; city: TripCity }[];
};

export async function fetchTrips(): Promise<TripListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, trip_members(count), trip_cities(position, city:cities(id, name))")
    .order("start_date", { ascending: false });
  if (error) throw error;
  // database.types.ts 가 수기 작성이라 관계 집계(count)·별칭 임베드의 타입이 없다. 그 부분만 좁게 단언한다.
  const rows = data as unknown as TripListRow[];
  return rows.map(({ trip_members, trip_cities, ...row }) => ({
    ...toTrip(row),
    // 나를 뺀 일행 수
    companionCount: Math.max((trip_members[0]?.count ?? 1) - 1, 0),
    cities: [...trip_cities].sort((a, b) => a.position - b.position).map((tc) => tc.city),
  }));
}

export async function fetchTrip(tripId: string): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (error) throw error;
  return toTrip(data);
}

export type NewTrip = { title: string; startDate: string; endDate: string; cityIds: string[] };

/** 여행과 도시를 한 트랜잭션으로 만든다 (create_trip, 0007). 새 여행 id 를 돌려준다. */
export async function createTrip(trip: NewTrip): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_trip", {
    p_title: trip.title,
    p_start: trip.startDate,
    p_end: trip.endDate,
    p_city_ids: trip.cityIds,
  });
  if (error) throw error;
  return data;
}

export type TripDates = { tripId: string; startDate: string; endDate: string };

/**
 * 여행 기간을 바꾼다 (update_trip_dates, 0008). 일정은 출발일 기준이라 함께 옮겨지고,
 * 줄어들어 사라지는 날의 일정은 새 마지막 날 끝으로 옮겨진다.
 */
export async function updateTripDates({ tripId, startDate, endDate }: TripDates) {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_trip_dates", {
    p_trip_id: tripId,
    p_start: startDate,
    p_end: endDate,
  });
  if (error) throw error;
}

/**
 * 기준 화폐를 바꾼다 — 여행 환율(새 기준으로 다시 계산한 값) · 지출별 환율 · 송금 기록 금액을 한 트랜잭션으로.
 * factor = 새 기준 1단위가 옛 기준으로 얼마인가(옛 기준 금액 ÷ factor = 새 기준 금액).
 * from = 화면이 알던 옛 기준 — 그사이 다른 사람이 바꿨으면 DB 가 거부한다(다른 기준의 factor 로 다시 나누지 않게)
 */
export async function changeHomeCurrency(
  tripId: string,
  from: string,
  currency: string,
  rates: ExchangeRates,
  factor: number,
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("change_home_currency", {
    p_trip_id: tripId,
    p_from: from,
    p_currency: currency,
    p_rates: rates,
    p_factor: factor,
  });
  if (error) throw error;
}

export async function updateTrip(tripId: string, values: TripFormValues): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({
      title: values.title,
      start_date: values.start_date,
      end_date: values.end_date,
      home_currency: values.home_currency,
      exchange_rates: ratesFromForm(values.rates),
    })
    .eq("id", tripId)
    .select("*")
    .single();
  if (error) throw error;
  return toTrip(data);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}

export async function rotateInviteToken(tripId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("rotate_invite_token", { p_trip_id: tripId });
  if (error) throw error;
  return data;
}
