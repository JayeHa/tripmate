import type { Tables } from "@/shared/api/supabase/database.types";

export type ScheduleItem = Tables<"schedule_items">;

export type TravelMode = "WALK" | "TRANSIT";

export type RouteLeg = {
  fromId: string;
  toId: string;
  durationSec: number;
  distanceM: number;
};

/** 하루치 일정 사이의 경로. schedule_items 에서 파생되는 read model 이다. */
export type DayRoute = {
  polyline: string | null;
  legs: RouteLeg[];
};
