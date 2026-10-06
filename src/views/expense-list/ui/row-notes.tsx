import { CircleAlert, MapPin } from "lucide-react";

import type { ExpenseRowView } from "../lib/row";

type RowNotesProps = {
  row: ExpenseRowView;
  onMarkPaid: () => void;
  /** 바꾸는 중 — 다시 누르지 못하게 */
  paying: boolean;
};

/**
 * 이름 아래 한 줄 — 예정일이 지났으면 주황 「예정일 지남 · 결제 완료로」(누르면 바로 결제 완료), 아니면 연결 일정(블루 핀).
 * 줄 전체가 링크라 버튼은 그 위에 올린다(relative z-10)
 */
export function RowNotes({ row, onMarkPaid, paying }: RowNotesProps) {
  if (row.overdue) {
    return (
      <button
        type="button"
        onClick={onMarkPaid}
        disabled={paying}
        className="relative z-10 flex items-center gap-1 self-start text-xs font-bold text-status-wait-text disabled:opacity-50"
      >
        <CircleAlert className="size-3" />
        예정일 지남 · <span className="underline">결제 완료로</span>
      </button>
    );
  }
  if (!row.linkName) return null;
  return (
    <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-primary">
      <MapPin className="size-3 shrink-0" />
      <span className="truncate">{row.linkName}</span>
    </span>
  );
}
