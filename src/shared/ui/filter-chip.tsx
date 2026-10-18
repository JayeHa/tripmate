import type * as React from "react";

import { cn } from "@/shared/lib/utils";

/** 칩 크기 — md 34(P2 기본) · sm 30(보조 줄) · lg 36(P20 날짜 칩) */
const SIZE = {
  md: "h-8.5 px-3.5",
  sm: "h-7.5 px-3",
  lg: "h-9 px-3.5",
};

type FilterChipProps = Omit<React.ComponentProps<"button">, "type"> & {
  /** 고른 칩 — 잉크 바탕 · 흰 글자(블루 선택 칩은 쓰지 않는다) */
  selected: boolean;
  size?: keyof typeof SIZE;
};

/**
 * 필터 · 선택 칩(P2) — 13/700, 미선택 #F2F3F5 · #444. 칩 줄은 gap 6, 가로로 넘치면 쓰는 쪽에서 스크롤.
 * 고르는 칩이라 aria-pressed 로 상태를 알린다
 */
export function FilterChip({ selected, size = "md", className, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full text-[13px] font-bold whitespace-nowrap disabled:opacity-40",
        SIZE[size],
        selected ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-700",
        className,
      )}
      {...props}
    />
  );
}
