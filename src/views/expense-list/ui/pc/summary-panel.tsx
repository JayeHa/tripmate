import type { ExpenseTotals } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";

type SummaryPanelProps = { total: ExpenseTotals; home: string };

/**
 * PC 오른쪽 칸(380) — 총 지출 금액(블루) · 결제 예정 · 통화별 지출.
 * 카테고리별 통계 · 정산은 지출내역 · 정산 단계(#18 ⑨)에서 이 칸 아래에 붙인다
 */
export function SummaryPanel({ total, home }: SummaryPanelProps) {
  const currencies = Object.entries(total.byCurrency).sort(([a], [b]) =>
    a === home ? -1 : Number(b === home),
  );
  return (
    <aside className="flex w-95 shrink-0 flex-col gap-6 overflow-y-auto px-7 py-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-ink-400">총 지출 금액</span>
        <span className="text-[32px] font-extrabold tracking-[-0.02em] text-primary">
          {formatMoney(total.home, home)}
        </span>
        {total.planned > 0 && (
          <span className="text-[13px] text-ink-400">
            이 중 결제 예정 {formatMoney(total.planned, home)}
          </span>
        )}
        {total.missing.length > 0 && (
          <span className="text-xs text-destructive">
            {total.missing.join(" · ")} 환율이 없어 합계에서 빠졌어요.
          </span>
        )}
      </div>
      {currencies.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-dashed border-line-strong pt-5">
          <span className="text-[15px] font-extrabold text-ink-900">통화별</span>
          {currencies.map(([currency, amount]) => (
            <div key={currency} className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink-400">{currency}</span>
              <span className="text-[15px] font-extrabold text-ink-900">
                {formatMoney(amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
