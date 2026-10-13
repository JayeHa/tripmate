import type { Tables } from "@/shared/api/supabase/database.types";

/** 체크리스트 항목 한 줄 */
export type ChecklistItem = Tables<"checklist_items">;

/** 상태 — 해야 할 것 · 기타 · 완료 */
export const CHECKLIST_STATUSES = ["todo", "etc", "done"] as const;
export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

/** 상태 이름 — 목록 묶음 제목 · 상태 칩 */
export const CHECKLIST_STATUS_LABEL: Record<ChecklistStatus, string> = {
  todo: "해야 할 것",
  etc: "기타",
  done: "완료",
};
