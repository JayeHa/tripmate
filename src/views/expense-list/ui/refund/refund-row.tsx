import { ChevronRight } from "lucide-react";

import { boughtLabel, type TaxRefund } from "@/entities/tax-refund";
import { methodText } from "@/features/expense/refund";
import { formatMoney } from "@/shared/lib/money";

type RefundRowProps = {
  refund: TaxRefund;
  /** 누구 것 — 일행이 있을 때만(혼자면 undefined), 정하지 않았으면 null */
  owner?: string | null;
  onOpen: () => void;
};

/**
 * 환급 한 줄 — 매장(15/700) · 아래 「김동규 · 11.1 (일) 17:01 · JPrefund · 공항 현금」(사람은 일행이 있을 때), 오른쪽 환급 예정액(15/800)과 구매 금액(12 회색).
 * 누르면 상세
 */
export function RefundRow({ refund: r, owner, onOpen }: RefundRowProps) {
  const sub = [owner, boughtLabel(r), r.provider, methodText(r)].filter(Boolean).join(" · ");
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold text-ink-900">{r.store}</span>
          <span className="truncate text-[13px] text-ink-400">{sub}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {r.refund_amount !== null && (
            <span className="text-[15px] font-extrabold text-ink-900">
              {formatMoney(r.refund_amount, r.currency)}
            </span>
          )}
          {r.amount !== null && (
            <span className="text-xs text-ink-400">구매 {formatMoney(r.amount, r.currency)}</span>
          )}
        </div>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-350" />
      </button>
    </li>
  );
}
