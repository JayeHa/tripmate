"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import type { ExpensePeriod } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { periodLabel } from "../../lib/period";

type PeriodFilterProps = {
  value: ExpensePeriod | "all";
  onChange: (value: ExpensePeriod | "all") => void;
  /** 여행 날 수 */
  totalDays: number;
  startDate: string;
};

/** 모바일 기간 필터 — 블루 외곽선 「기간전체 ⌄」, 누르면 바텀시트에서 전체 · 여행준비 · day N 을 고른다 */
export function PeriodFilter({ value, onChange, totalDays, startDate }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const options: (ExpensePeriod | "all")[] = [
    "all",
    "prep",
    ...Array.from({ length: totalDays }, (_, i) => i),
  ];
  /** 고르는 줄의 글 */
  const text = (p: ExpensePeriod | "all") => {
    if (p === "all") return "기간전체";
    const { label, date } = periodLabel(p, startDate);
    return date ? `${label} · ${date}` : label;
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1 rounded-button border border-primary pr-3 pl-3.5 text-sm font-bold text-primary"
      >
        {value === "all" ? "기간전체" : periodLabel(value, startDate).label}
        <ChevronDown className="size-4" />
      </button>
      <SheetDialog open={open} onClose={() => setOpen(false)} title="기간">
        <ul className="flex flex-col pb-2">
          {options.map((p) => (
            <li key={String(p)}>
              <button
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-13 w-full items-center justify-between text-left text-base font-semibold",
                  p === value ? "text-primary" : "text-ink-900",
                )}
              >
                {text(p)}
                {p === value && <Check className="size-5" />}
              </button>
            </li>
          ))}
        </ul>
      </SheetDialog>
    </>
  );
}
