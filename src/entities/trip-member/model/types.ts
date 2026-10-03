import type { Tables } from "@/shared/api/supabase/database.types";

export type Profile = Tables<"profiles">;
export type TripMember = Tables<"trip_members"> & { profile: Profile };
