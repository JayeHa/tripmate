import { type ChecklistItem, daysUntil, dueView } from "@/entities/checklist";
import { type Voucher, VOUCHER_GROUP_LABEL, voucherGroup } from "@/entities/voucher";

import { checklistPeek, type Peek, type PeekContext, voucherPeek } from "./peek";

/** 고정한 할 일 한 칸 — label 은 「체크리스트 · 10/27(화) · D-3」, soon 이면 마감이 7일 안(지난 것 포함) */
export type PinnedTodo = {
  id: string;
  title: string;
  label: string;
  soon: boolean;
  done: boolean;
  peek: Peek;
};

/** 고정한 바우처 한 칸 — label 은 「바우처 · 숙소」(무엇에 연결됐는지) */
export type PinnedVoucher = { id: string; title: string; label: string; peek: Peek };

/** 할 일 칸의 윗줄 — 완료면 「완료」, 마감이 있으면 그 날짜 · D-day */
function todoLabel(item: ChecklistItem, today: string): Pick<PinnedTodo, "label" | "soon"> {
  if (item.status === "done") return { label: "체크리스트 · 완료", soon: false };
  if (!item.due_date) return { label: "체크리스트", soon: false };
  const due = dueView(item.due_date, today);
  return { label: `체크리스트 · ${due.text}`, soon: due.soon };
}

/** 마감 순서 — 마감 없는 것은 뒤로 */
function dueOrder(item: ChecklistItem, today: string): number {
  return item.due_date ? daysUntil(item.due_date, today) : Number.POSITIVE_INFINITY;
}

/**
 * 「홈에 고정」 한 체크리스트 할 일 — 안 끝난 것 먼저, 그 안에서 마감이 이른 순(마감 없는 것은 뒤). 완료한 것도 고정을 풀기 전까지 남는다
 */
export function pinnedTodos(checklist: ChecklistItem[], ctx: PeekContext): PinnedTodo[] {
  return checklist
    .filter((c) => c.pinned_by !== null)
    .sort(
      (a, b) =>
        Number(a.status === "done") - Number(b.status === "done") ||
        dueOrder(a, ctx.today) - dueOrder(b, ctx.today),
    )
    .map((c) => ({
      id: c.id,
      title: c.title,
      ...todoLabel(c, ctx.today),
      done: c.status === "done",
      peek: checklistPeek(c, ctx),
    }));
}

/** 「홈에 고정」 한 바우처 — 노트 목록과 같은 순서(올린 순) */
export function pinnedVouchers(vouchers: Voucher[], ctx: PeekContext): PinnedVoucher[] {
  return vouchers
    .filter((v) => v.pinned_by !== null)
    .map((v) => ({
      id: v.id,
      title: v.title,
      label: `바우처 · ${VOUCHER_GROUP_LABEL[voucherGroup(v)]}`,
      peek: voucherPeek(v, ctx),
    }));
}
