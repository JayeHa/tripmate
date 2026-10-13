import { createClient } from "@/shared/api/supabase/client";

import type { ChecklistFields, ChecklistItem, ChecklistStatus } from "../model/types";

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

/**
 * 추가 · 편집 창 저장 — id 가 없으면 새로 넣고, 있으면 그 항목을 고친다.
 * 고칠 때 0행이면(그사이 일행이 지웠다) 던진다
 */
export async function saveChecklistItem(
  tripId: string,
  id: string | null,
  fields: ChecklistFields,
): Promise<ChecklistItem> {
  const supabase = createClient();
  if (id === null) {
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({ trip_id: tripId, ...fields })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("checklist_items")
    .update(fields)
    .eq("id", id)
    .select("*");
  if (error) throw error;
  if (data.length === 0) throw new Error(CHECKLIST_GONE);
  return data[0];
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
