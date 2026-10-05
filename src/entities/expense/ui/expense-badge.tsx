import { cn } from "@/shared/lib/utils";

type ExpenseBadgeProps = { children: string; className?: string };

/** 지출 줄의 회색 배지 — 「결제 예정」 · 「합계 제외」(20 · r4 · 11/800) */
export function ExpenseBadge({ children, className }: ExpenseBadgeProps) {
  return (
    <span
      className={cn(
        "flex h-5 shrink-0 items-center rounded-tag bg-status-opt-bg px-1.5 text-[11px] font-extrabold text-cat-move",
        className,
      )}
    >
      {children}
    </span>
  );
}
