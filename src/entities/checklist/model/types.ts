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

/** 링크 한 줄(저장된 것) */
export type ChecklistLink = { title: string; url: string };

/** 추가 · 편집 창이 저장하는 칸 */
export type ChecklistFields = {
  status: ChecklistStatus;
  title: string;
  /** 「YYYY-MM-DD」, 없으면 null */
  due_date: string | null;
  body: string;
  links: ChecklistLink[];
  /** 홈에 고정한 사람. 고정하지 않으면 null */
  pinned_by: string | null;
};

/** 연결 대상의 종류 — 일정 카드 · 항공편 · 숙소 */
export type ChecklistTargetKind = "schedule_item" | "flight" | "stay";

/** 연결 대상 하나 */
export type ChecklistTargetRef = { kind: ChecklistTargetKind; id: string };

/** 연결 한 줄(저장된 것) — 어느 항목이 무엇에 붙었는지 */
export type ChecklistTargetRow = Tables<"checklist_targets">;

/**
 * 추가 · 편집 창 저장 — 새 항목은 모든 칸 · 고른 연결, 편집은 바뀐 칸 · 더하고 뺀 연결만
 * (그사이 일행이 바꾼 다른 칸 · 연결을 덮지 않게)
 */
export type ChecklistSave =
  | { id: null; fields: ChecklistFields; add: ChecklistTargetRef[]; remove: [] }
  | {
      id: string;
      fields: Partial<ChecklistFields>;
      add: ChecklistTargetRef[];
      remove: ChecklistTargetRef[];
    };
