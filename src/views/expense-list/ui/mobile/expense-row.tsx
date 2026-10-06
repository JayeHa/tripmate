import Link from "next/link";

import { ExpenseBadge, ExpenseCategoryTile } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import type { ExpenseRowView } from "../../lib/row";
import { RowNotes } from "../row-notes";

type ExpenseRowProps = {
  row: ExpenseRowView;
  href: string;
  onMarkPaid: () => void;
  /** 결제 완료로 바꾸는 중 */
  paying: boolean;
};

/**
 * 모바일 가계부 한 줄 — 카테고리 아이콘 20 · 이름 17/700(+ 결제 예정 · 합계 제외 배지) · 아래 연결 일정이나 예정일 지남,
 * 오른쪽 금액 17/800 · 외화면 근사치와 환율 · 「결제 : 나 | 함께 : 나, 김동규」. 합계에서 뺀 지출은 흐리다
 */
export function ExpenseRow({ row, href, onMarkPaid, paying }: ExpenseRowProps) {
  return (
    <div
      className={cn(
        "relative flex gap-2.5 border-b border-surface-muted py-4",
        row.excluded && "opacity-50",
      )}
    >
      <ExpenseCategoryTile category={row.category} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          <Link
            href={href}
            className="min-w-0 truncate text-[17px] font-bold text-ink-900 after:absolute after:inset-0"
          >
            {row.name}
          </Link>
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </div>
        <RowNotes row={row} onMarkPaid={onMarkPaid} paying={paying} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[17px] font-extrabold text-ink-900">{row.amountText}</span>
        {row.approxText && <span className="text-xs text-ink-400">{row.approxText}</span>}
        {row.rateText && <span className="text-[11px] text-ink-350">{row.rateText}</span>}
        <span className="text-xs text-ink-350">
          {row.splitEach ? "각자 냄" : `결제 : ${row.payer?.name ?? "-"}`} | 함께 : {row.together}
        </span>
      </div>
    </div>
  );
}
