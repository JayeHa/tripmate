import {
  CHECKLIST_STATUS_LABEL,
  CHECKLIST_STATUSES,
  type ChecklistItem,
  type ChecklistStatus,
} from "../model/types";

/** 목록의 묶음 하나 */
export type ChecklistGroup = { status: ChecklistStatus; label: string; items: ChecklistItem[] };

/**
 * 마감순 — 마감일이 이른 것부터, 마감 없는 것은 뒤. 같으면 나중에 넣은 것이 위.
 * 빠른 추가(마감 없음)는 마감 없는 것들 중 맨 위 — 마감 있는 항목이 있으면 그 아래에 붙는다
 */
export function byDue(a: ChecklistItem, b: ChecklistItem): number {
  const due = (a.due_date ?? "9").localeCompare(b.due_date ?? "9");
  return due || b.created_at.localeCompare(a.created_at);
}

/** 해야 할 것 → 기타 → 완료 묶음, 묶음마다 마감순. 빈 묶음은 뺀다 */
export function checklistGroups(items: readonly ChecklistItem[]): ChecklistGroup[] {
  return CHECKLIST_STATUSES.map((status) => ({
    status,
    label: CHECKLIST_STATUS_LABEL[status],
    items: items.filter((i) => i.status === status).sort(byDue),
  })).filter((g) => g.items.length > 0);
}

/** 남은 항목 수(완료 아닌 것) — 노트 탭 · 메뉴의 숫자 */
export function openCount(items: readonly Pick<ChecklistItem, "status">[]): number {
  return items.filter((i) => i.status !== "done").length;
}

/** 체크박스를 누른 뒤의 상태 — 완료면 해야 할 것으로, 아니면(해야 할 것 · 기타) 완료로 */
export function toggledStatus(status: string): ChecklistStatus {
  return status === "done" ? "todo" : "done";
}
