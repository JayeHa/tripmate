import { createClient } from "@/shared/api/supabase/client";

import type { ChecklistItem, ChecklistStatus } from "../model/types";

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
  if (data.length === 0) throw new Error("이미 지워진 항목이에요");
}
