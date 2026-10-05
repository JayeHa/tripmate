import { createClient } from "@/shared/api/supabase/client";

import type { ScheduleItem } from "../model/types";

/** 여행의 대체 장소 줄(장소 포함). 붙은 일정(alternative_of)마다 모아 쓴다 — 넣은 순서 */
export async function fetchAlternatives(tripId: string): Promise<ScheduleItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*, place:places(*)")
    .eq("trip_id", tripId)
    .not("alternative_of", "is", null)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data;
}

/**
 * 저장한 장소를 일정의 대체 장소로 붙인다. 날짜는 DB 트리거가 붙은 일정에 맞추고(낡은 값을 보내도 된다),
 * 시간은 갖지 않는다. 붙일 수 있는 장소인지는 일정과 같은 RLS(`can_attach_place`)가 본다
 */
export async function addAlternative(main: ScheduleItem, placeId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("schedule_items").insert({
    trip_id: main.trip_id,
    day_index: main.day_index,
    // 대체 장소끼리의 순서는 넣은 시각(created_at)으로 본다
    position: 0,
    kind: "place",
    place_id: placeId,
    alternative_of: main.id,
  });
  if (error) throw error;
}

/**
 * 「바꾸기」 — 대체 장소가 그 자리(날짜 · 순서 · 시간 · 이동 기록)에 들어가고 원래 일정은 그 대체 장소가 된다(0024 swap_alternative).
 * 예약 상태 · 링크 · 메모는 각자 줄에 남아 장소를 따라간다
 */
export async function swapAlternative(altId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("swap_alternative", { p_alt: altId });
  if (error) throw error;
}
