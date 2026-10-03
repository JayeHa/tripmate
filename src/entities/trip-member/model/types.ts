import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;
export type TripMember = Tables<"trip_members"> & { profile: Profile };
