import { createClient } from "@/shared/api/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/shared/api/supabase/database.types";

import type { Memo } from "../model/memo";

/** 여행의 메모 전부. 일정마다 모으는 건 부른 쪽(memosByItem) */
export async function fetchMemos(tripId: string): Promise<Memo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 메모를 쓴다. 작성자는 DB 트리거가 나로 채운다 */
export async function createMemo(memo: TablesInsert<"memos">): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("memos").insert(memo);
  if (error) throw error;
}

/** 메모를 고친다(멤버 누구나). 작성자는 바뀌지 않는다 */
export async function updateMemo(id: string, patch: TablesUpdate<"memos">): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("memos").update(patch).eq("id", id);
  if (error) throw error;
}

/** 메모를 지운다(멤버 누구나) */
export async function deleteMemo(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("memos").delete().eq("id", id);
  if (error) throw error;
}
