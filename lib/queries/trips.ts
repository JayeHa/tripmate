import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { ExchangeRates, Trip } from "@/lib/types";
import type { TripFormValues } from "@/lib/schemas/trip";

function toTrip(row: Tables<"trips">): Trip {
  return { ...row, exchange_rates: (row.exchange_rates ?? {}) as ExchangeRates };
}

export function ratesFromForm(rates: TripFormValues["rates"]): ExchangeRates {
  return Object.fromEntries(rates.map((r) => [r.currency, { unit: r.unit, value: r.value }]));
}

export function ratesToForm(rates: ExchangeRates): TripFormValues["rates"] {
  return Object.entries(rates).map(([currency, r]) => ({ currency, unit: r.unit, value: r.value }));
}

export async function fetchTrips(): Promise<Trip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data.map(toTrip);
}

export async function fetchTrip(tripId: string): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (error) throw error;
  return toTrip(data);
}

export async function createTrip(values: TripFormValues, ownerId: string): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: ownerId,
      title: values.title,
      destination: values.destination || null,
      start_date: values.start_date,
      end_date: values.end_date,
      home_currency: values.home_currency,
      exchange_rates: ratesFromForm(values.rates),
    })
    .select("*")
    .single();
  if (error) throw error;
  return toTrip(data);
}

export async function updateTrip(tripId: string, values: TripFormValues): Promise<Trip> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({
      title: values.title,
      destination: values.destination || null,
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
