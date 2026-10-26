"use client";

import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { currencyName, type ExchangeRates, formatMoney } from "@/shared/lib/money";
import { NAV } from "@/shared/lib/nav-transition";
import { useOpenCount } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { addAmount, convertAmount, pressKey, quickAmounts } from "../../lib/calculator";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"];

type CalcBodyProps = {
  tripId: string;
  /** 여행지 통화 · 기준 화폐 · 여행 환율 */
  local: string;
  home: string;
  rates: ExchangeRates;
  /** 「이 금액으로 비용 추가」 의 처음 날짜(0-base 날). 여행 중이 아니면 null(가계부가 정한다) */
  period: number | null;
};

/**
 * 계산기 내용 — 위 칸(친 금액) · 아래 칸(여행 환율로 바꾼 금액), ⇅ 로 방향 바꾸기, 빠른 칩 · 키패드.
 * 「이 금액으로 비용 추가」 는 친 금액 · 통화가 채워진 비용 추가로 간다
 */
function CalcBody({ tripId, local, home, rates, period }: CalcBodyProps) {
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState(local);
  const to = from === local ? home : local;
  const value = Number(amount) || 0;
  const converted = convertAmount(value, from, to, home, rates);
  const rate = rates[local];
  const query = new URLSearchParams({ amount, currency: from });
  if (period !== null) query.set("period", String(period));
  return (
    <div className="flex flex-col gap-3.5">
      <div className="-mt-1.5 flex items-center gap-1.5">
        {rate && (
          <span className="text-[13px] font-semibold text-ink-700">
            {rate.unit.toLocaleString("ko-KR")}
            {currencyName(local)} = {formatMoney(rate.value, home)}
          </span>
        )}
        <span className="flex h-5 items-center rounded-[5px] bg-surface-muted px-1.75 text-[11px] font-bold text-ink-500">
          여행 환율
        </span>
      </div>
      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <span className="w-11 text-[13px] font-bold text-ink-400">{from}</span>
          <span className="flex-1 truncate text-right text-[26px] font-extrabold text-ink-900">
            {formatMoney(value, from)}
          </span>
        </div>
        <div className="relative h-px bg-surface-muted">
          <button
            type="button"
            aria-label="바꾸는 방향 바꾸기"
            onClick={() => setFrom(to)}
            className="absolute -top-3.75 left-3 flex size-7.5 cursor-pointer items-center justify-center rounded-full border border-line bg-white"
          >
            <ArrowUpDown className="size-3.75 text-ink-700" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2.5 bg-surface-sunken px-4 py-3">
          <span className="w-11 text-[13px] font-bold text-ink-400">{to}</span>
          <span className="flex-1 truncate text-right text-[26px] font-extrabold text-brand-text">
            {converted === null ? "—" : formatMoney(converted, to)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickAmounts(from).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAmount((a) => addAmount(a, n))}
            className="flex h-8 cursor-pointer items-center rounded-full bg-surface-muted px-3 text-[13px] font-bold whitespace-nowrap text-ink-700"
          >
            +{formatMoney(n, from)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmount("")}
          className="flex h-8 cursor-pointer items-center rounded-full bg-surface-muted px-3 text-[13px] font-bold text-ink-700"
        >
          지우기
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            aria-label={k === "⌫" ? "한 자리 지우기" : undefined}
            onClick={() => setAmount((a) => pressKey(a, k))}
            className="flex h-12.5 cursor-pointer items-center justify-center rounded-memo text-[22px] font-semibold text-ink-900 hover:bg-surface-sunken"
          >
            {k}
          </button>
        ))}
      </div>
      {amount ? (
        <Link
          href={`/trips/${tripId}/expenses/new?${query.toString()}`}
          transitionTypes={NAV.forward}
          className={cn(buttonVariants({ size: "form" }), "w-full")}
        >
          이 금액으로 비용 추가
        </Link>
      ) : (
        <button type="button" disabled className={cn(buttonVariants({ size: "form" }), "w-full")}>
          이 금액으로 비용 추가
        </button>
      )}
    </div>
  );
}

type RateCalculatorProps = CalcBodyProps & { open: boolean; onClose: () => void };

/**
 * 환율 계산기 — 모바일은 바텀시트, PC 는 가운데 창. 열 때마다 빈 금액 · 여행지 통화 → 기준 화폐로 시작한다
 */
export function RateCalculator({ open, onClose, ...body }: RateCalculatorProps) {
  const openCount = useOpenCount(open);
  return (
    <SheetDialog open={open} onClose={onClose} title="환율 계산">
      <CalcBody key={openCount} {...body} />
    </SheetDialog>
  );
}
