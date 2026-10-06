import { createClient } from "@/shared/api/supabase/client";

import type { TripGuest } from "../model/types";

/** 여행의 정산 인원 — 넣은 순서 */
export async function fetchTripGuests(tripId: string): Promise<TripGuest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_guests")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 정산 인원을 넣는다. 이름은 1–20자(DB check) */
export async function addTripGuest(tripId: string, name: string): Promise<TripGuest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_guests")
    .insert({ trip_id: tripId, name: name.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** 그 사이 일행이 이 인원을 뺐다 — 부른 쪽이 이 문구를 그대로 보인다 */
export const GUEST_GONE = "이미 빠진 인원이에요";

/**
 * 이름을 바꾼다. 0행이면(그사이 빠졌거나 권한이 없다 — RLS 는 오류 없이 0행으로 끝난다) GUEST_GONE 을 던진다
 */
export async function renameTripGuest(guestId: string, name: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_guests")
    .update({ name: name.trim() })
    .eq("id", guestId)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(GUEST_GONE);
}

/** 그 사이 일행이 이 인원을 비용에 넣어 뺄 수 없다 — 부른 쪽이 이 문구를 그대로 보인다 */
export const GUEST_IN_USE = "이미 비용에 들어 있어 뺄 수 없어요";

/**
 * 정산 인원을 뺀다. 비용(결제 · 나눔) · 송금 기록에 쓰고 있으면 DB 가 막는다(on delete restrict) —
 * 그때는 GUEST_IN_USE 로 바꿔 던진다
 */
export async function removeTripGuest(guestId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("trip_guests").delete().eq("id", guestId);
  if (error) throw error.code === "23503" ? new Error(GUEST_IN_USE) : error;
}
