import { createClient } from "@/shared/api/supabase/client";

import type { PersonRef } from "../lib/person";
import type { Settlement } from "../model/types";

/** 여행에서 이미 보낸 돈 — 보낸 순서 */
export async function fetchSettlements(tripId: string): Promise<Settlement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("trip_id", tripId)
    .order("settled_at");
  if (error) throw error;
  return data;
}

/** 사람 → 보낸 쪽 · 받는 쪽 두 칸(멤버면 user, 정산 인원이면 guest) */
function personColumns(prefix: "from" | "to", person: PersonRef) {
  return {
    [`${prefix}_user_id`]: person.kind === "member" ? person.id : null,
    [`${prefix}_guest_id`]: person.kind === "guest" ? person.id : null,
  };
}

/** 「받았어요 · 보냈어요」 — 보낸 돈 한 줄을 남긴다 */
export async function addSettlement(
  tripId: string,
  from: PersonRef,
  to: PersonRef,
  amount: number,
  createdBy: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("settlements").insert({
    trip_id: tripId,
    ...personColumns("from", from),
    ...personColumns("to", to),
    amount,
    created_by: createdBy,
  });
  if (error) throw error;
}

/** 되돌리기 — 그 기록을 지운다 */
export async function removeSettlement(settlementId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("settlements").delete().eq("id", settlementId);
  if (error) throw error;
}
