"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import type { ExpenseTotals } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

/** 합계 바 높이 — 이 화면의 토스트는 이만큼 더 올린다(하단 탭 위 바에 겹치지 않게) */
export const TOTAL_BAR_HEIGHT = 64;

type TotalBarProps = {
  total: ExpenseTotals;
  home: string;
};

/**
 * 하단 탭 위에 붙는 합계 바(64) — 「₩1,367,717 지출」 · 결제 예정이 있으면 「이 중 결제 예정 …」.
 * 누르면 위로 펼쳐 통화별 지출(외화는 근사치 없이 쓴 금액)을 보인다. 펼치면 뒤를 살짝 어둡게 덮고, 그곳을 누르면 접는다
 */
export function TotalBar({ total, home }: TotalBarProps) {
  const [open, setOpen] = useState(false);
  const currencies = Object.entries(total.byCurrency).sort(([a], [b]) =>
    a === home ? -1 : Number(b === home),
  );
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="통화별 지출 접기"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 bg-ink-900/20"
        />
      )}
      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(83px+env(safe-area-inset-bottom))] z-10 flex flex-col border-t border-divider bg-white shadow-[0_-6px_16px_rgba(0,0,0,.06)]",
          open && "rounded-t-sheet",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={{ height: TOTAL_BAR_HEIGHT }}
          className="flex flex-col items-center justify-center gap-0.5"
        >
          {open ? (
            <ChevronDown className="size-4.5 text-ink-350" />
          ) : (
            <ChevronUp className="size-4.5 text-ink-350" />
          )}
          <span className="text-[19px] font-extrabold text-ink-900">
            {formatMoney(total.home, home)} 지출
          </span>
          {total.planned > 0 && (
            <span className="text-xs text-ink-400">
              이 중 결제 예정 {formatMoney(total.planned, home)}
            </span>
          )}
        </button>
        {open && (
          <div className="mx-5 flex flex-col border-t border-line-card pt-1.5 pb-2.5">
            {currencies.map(([currency, amount]) => (
              <div key={currency} className="flex min-h-13 items-center justify-between gap-3">
                <span className="text-[15px] font-bold text-ink-400">{currency}</span>
                <span className="text-base font-extrabold text-ink-900">
                  {formatMoney(amount, currency)}
                </span>
              </div>
            ))}
            {total.missing.length > 0 && (
              <p className="py-2 text-xs text-destructive">
                {total.missing.join(" · ")} 환율이 없어 합계에서 빠졌어요. 설정에서 환율을 넣어
                주세요.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
