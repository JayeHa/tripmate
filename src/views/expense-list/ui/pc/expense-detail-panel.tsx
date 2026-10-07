import { X } from "lucide-react";

import { ExpenseCategoryTile, type ExpenseRowView } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import type { DetailField } from "../../lib/detail-fields";

type ExpenseDetailPanelProps = {
  row: ExpenseRowView;
  /** 금액 두 줄 — 표의 「현지 금액 / 원화」 를 따른다 */
  amount: { big: string; small: string | null };
  fields: DetailField[];
  /** 「수정」 — 비용 입력 창을 연다 */
  onEdit: () => void;
  /** ✕ — 요약으로 돌아간다 */
  onClose: () => void;
};

/**
 * PC 가계부 오른쪽 비용 상세 — 표에서 줄을 고르면 요약 카드 자리에 그린다. 머리 「비용 상세」 · 「수정」 · ✕,
 * 카테고리 타일 44 + 항목명 · 금액 26/800(작은 줄), 표(날짜 · 카테고리 · 결제수단 · 결제 · 함께 · 일정 · 메모), 아래 키 안내
 */
export function ExpenseDetailPanel({
  row,
  amount,
  fields,
  onEdit,
  onClose,
}: ExpenseDetailPanelProps) {
  return (
    <section
      aria-label="비용 상세"
      className="flex shrink-0 flex-col gap-2.5 rounded-[16px] border border-divider bg-background px-4.5 py-4"
    >
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-[13px] font-bold text-ink-400">비용 상세</h2>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7.5 items-center rounded-button border border-line-strong px-3 text-[13px] font-bold text-ink-900 hover:bg-surface-sunken"
        >
          수정
        </button>
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-500">
          <X className="size-4.5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <ExpenseCategoryTile category={row.category} size="lg" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm text-ink-600">{row.name}</span>
          <span className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
            {amount.big}
          </span>
          {amount.small && <span className="text-xs text-ink-400">{amount.small}</span>}
        </div>
      </div>
      <dl className="flex flex-col">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-3 border-t border-surface-muted py-2.5">
            <dt className="w-16 shrink-0 text-[13px] text-ink-400">{f.label}</dt>
            <dd
              className={cn(
                "min-w-0 flex-1 text-sm font-semibold wrap-break-word whitespace-pre-line",
                f.muted ? "text-ink-350" : "text-ink-900",
              )}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-350">↑↓ 다른 비용 · Esc 닫기</p>
    </section>
  );
}
