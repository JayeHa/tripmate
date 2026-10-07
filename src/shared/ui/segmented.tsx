"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type SegmentedProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  /** 칸을 트랙 너비만큼 나눠 채운다(결제수단 3칸처럼). 아니면 글자만큼 */
  fill?: boolean;
  className?: string;
};

/**
 * 세그먼트(P18) — 회색 트랙(안쪽 2 · r10)에 칸 30 · r8 · 13/700. 고른 칸은 흰 바탕 + 그림자 · 잉크, 나머지는 #888.
 * 켜짐이 기본인 스위치 대신 「둘 중 하나」 를 고를 때 쓴다(결제수단 · 내 송금 | 전체 송금 · 결제 통화 | 원화 환산)
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  fill = false,
  className,
  ...aria
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn(
        "gap-0.5 rounded-memo bg-surface-muted p-0.5",
        fill ? "grid auto-cols-fr grid-flow-col" : "inline-flex",
        className,
      )}
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const on = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={cn(
              "flex h-7.5 items-center justify-center gap-1 rounded-button px-3 text-[13px] font-bold whitespace-nowrap",
              on ? "bg-white text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-ink-450",
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
