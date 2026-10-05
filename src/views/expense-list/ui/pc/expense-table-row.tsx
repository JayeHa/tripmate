import Link from "next/link";

import { ExpenseBadge, ExpenseCategoryIcon } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import type { ExpenseRowView } from "../../lib/row";
import { RowNotes } from "../row-notes";
import { TABLE_COLUMNS } from "./columns";
import { PersonAvatar } from "./person";

type ExpenseTableRowProps = {
  row: ExpenseRowView;
  href: string;
  onMarkPaid: () => void;
  avatarOf: (userId: string) => string | null;
};

/** PC 가계부 표 한 줄 — 카테고리 | 이름(+ 배지 · 연결 일정) | 결제한 사람 | 함께한 사람(아바타 겹침) | 금액(+ 근사치 · 환율) */
export function ExpenseTableRow({ row, href, onMarkPaid, avatarOf }: ExpenseTableRowProps) {
  return (
    <div
      className={cn(
        "relative items-center border-b border-surface-muted py-3.25 hover:bg-[#FAFBFC]",
        TABLE_COLUMNS,
        row.excluded && "opacity-50",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-7.5 shrink-0 items-center justify-center rounded-button bg-surface-sunken">
          <ExpenseCategoryIcon category={row.category} className="size-4" />
        </span>
        <span className="text-[13px] text-ink-500">{row.categoryLabel}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.75">
        <div className="flex min-w-0 items-center gap-2">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          <Link
            href={href}
            className="min-w-0 truncate text-[15px] font-bold text-ink-900 after:absolute after:inset-0"
          >
            {row.name}
          </Link>
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </div>
        <RowNotes row={row} onMarkPaid={onMarkPaid} />
      </div>
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink-600">
        <PersonAvatar name={row.payer} avatarUrl={avatarOf(row.payerId)} />
        <span className="truncate">{row.payer}</span>
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 -space-x-1.5">
          {row.togetherPeople.map((p) => (
            <PersonAvatar key={p.id} name={p.name} avatarUrl={avatarOf(p.id)} />
          ))}
        </div>
        <span className="truncate text-sm text-ink-600">{row.together}</span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[15px] font-extrabold text-ink-900">{row.amountText}</span>
        {row.approxText && <span className="text-xs text-ink-350">{row.approxText}</span>}
        {row.rateText && <span className="text-[11px] text-ink-350">{row.rateText}</span>}
      </div>
    </div>
  );
}
