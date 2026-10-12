import { cn } from "@/shared/lib/utils";

import type { ExpenseRowView } from "../lib/row";
import { ExpenseBadge } from "./expense-badge";

type ExpenseLineProps = { row: ExpenseRowView; onClick: () => void };

/**
 * 연결된 비용 한 줄(일정 상세 · 항공편 상세) — [결제 예정] 항목명 [합계 제외] / 결제한 사람 · 결제수단 | 금액 · ≈ 기준 화폐.
 * 누르면 그 비용 수정
 */
export function ExpenseLine({ row, onClick }: ExpenseLineProps) {
  const who = row.splitEach || !row.payer ? "각자 냄" : `${row.payer.name} 결제`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2.5 text-left"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.25">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          <span className="truncate text-sm font-semibold text-ink-800">{row.name}</span>
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </span>
        <span className="truncate text-xs text-ink-400">
          {who} · {row.methodLabel}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-px">
        <span
          className={cn(
            "text-[15px] font-extrabold",
            row.excluded ? "text-ink-350 line-through" : "text-ink-900",
          )}
        >
          {row.amountText}
        </span>
        {row.approxText && <span className="text-[11px] text-ink-400">{row.approxText}</span>}
      </div>
    </button>
  );
}
