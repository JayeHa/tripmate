import { createClient } from "@/shared/api/supabase/client";

import type { TripMember } from "../model/types";

export async function fetchMembers(tripId: string): Promise<TripMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_members")
    .select("trip_id, user_id, role, joined_at, profile:profiles(*)")
    .eq("trip_id", tripId)
    .order("joined_at");
  if (error) throw error;
  return data;
}

export async function removeMember(tripId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  if (error) throw error;
}
