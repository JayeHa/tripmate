import { createClient } from "@/shared/api/supabase/client";

import type { Move, MoveMode } from "../model/move";

/** 여행의 모든 이동 기록 */
export async function fetchMoves(tripId: string): Promise<Move[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("moves").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data;
}

export type MoveInput = {
  tripId: string;
  fromItemId: string;
  toItemId: string;
  mode: MoveMode | null;
  detail: string | null;
};

/** 쌍의 이동 방법을 저장한다. 같은 쌍이 있으면 덮어쓴다(from · to unique) */
export async function saveMove(input: MoveInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("moves").upsert(
    {
      trip_id: input.tripId,
      from_item_id: input.fromItemId,
      to_item_id: input.toItemId,
      mode: input.mode,
      detail: input.detail,
    },
    { onConflict: "from_item_id,to_item_id" },
  );
  if (error) throw error;
}

/** 쌍의 이동 방법을 지운다 */
export async function deleteMove(fromItemId: string, toItemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("moves")
    .delete()
    .eq("from_item_id", fromItemId)
    .eq("to_item_id", toItemId);
  if (error) throw error;
}
