import { createClient } from "@/shared/api/supabase/client";

import { targetColumns } from "../lib/targets";
import type {
  ChecklistItem,
  ChecklistSave,
  ChecklistStatus,
  ChecklistTargetRow,
} from "../model/types";

/** 고치려는 항목이 없다 — 그사이 일행이 지웠다 */
export const CHECKLIST_GONE = "이미 지워진 항목이에요";

/** 여행의 체크리스트 — 순서는 화면이 묶음 · 마감순으로 정한다(checklistGroups) */
export async function fetchChecklist(tripId: string): Promise<ChecklistItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 빠른 추가 — 제목만으로 「해야 할 것」 에 넣는다 */
export async function addChecklistItem(tripId: string, title: string): Promise<ChecklistItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({ trip_id: tripId, title: title.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * 상태 바꾸기(체크박스). 0행이면(그사이 일행이 지웠거나 권한이 없다 — RLS 는 오류 없이 0행으로 끝난다) 던진다
 */
export async function setChecklistStatus(id: string, status: ChecklistStatus): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(CHECKLIST_GONE);
}

/** 여행의 체크리스트 연결 — 항목마다 묶는 것은 화면이 한다(targetsByItem) */
export async function fetchChecklistTargets(tripId: string): Promise<ChecklistTargetRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_targets")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/**
 * 추가 · 편집 창 저장(save_checklist_item, 0058) — 항목 칸과 연결을 한 트랜잭션으로. 항목 id 를 돌려준다.
 * 고칠 항목이 없으면(그사이 일행이 지웠다) 던진다. 그사이 지워진 대상은 DB 가 건너뛴다
 */
export async function saveChecklistItem(tripId: string, save: ChecklistSave): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_checklist_item", {
    p_trip: tripId,
    p_id: save.id,
    p_fields: save.fields,
    p_add: save.add.map(targetColumns),
    p_remove: save.remove.map(targetColumns),
  });
  if (error?.code === "P0002") throw new Error(CHECKLIST_GONE);
  if (error) throw error;
  return data;
}

/** 홈에 고정 · 풀기 — 고정한 사람을 남긴다(null 이면 푼다). 0행이면 던진다 */
export async function setChecklistPin(id: string, pinnedBy: string | null): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .update({ pinned_by: pinnedBy })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(CHECKLIST_GONE);
}

/** 지우기. 이미 지워졌으면(0행) 그대로 끝낸다 — 지우려던 결과와 같다 */
export async function deleteChecklistItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) throw error;
}
