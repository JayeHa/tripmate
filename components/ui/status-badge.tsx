import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * 예약 상태 배지. 색 단어 하나로 끝내고 문장으로 늘이지 않는다.
 * appearance="text" 는 카드 메타 줄에, "soft" 는 목록·칩 옆에 쓴다.
 */
const statusBadgeVariants = cva("inline-flex w-fit items-center whitespace-nowrap", {
  variants: {
    kind: {
      ok: "text-status-ok",
      wait: "text-status-wait",
      buy: "text-status-buy",
      opt: "text-status-opt",
      walk: "text-status-walk",
    },
    appearance: {
      text: "text-sm font-semibold",
      soft: "rounded-tag px-1.5 py-0.5 text-[11px] font-bold",
    },
  },
  compoundVariants: [
    { kind: "ok", appearance: "soft", className: "bg-status-ok-bg" },
    { kind: "wait", appearance: "soft", className: "bg-status-wait-bg" },
    { kind: "buy", appearance: "soft", className: "bg-status-buy-bg" },
    { kind: "opt", appearance: "soft", className: "bg-status-opt-bg" },
    { kind: "walk", appearance: "soft", className: "bg-status-walk-bg" },
  ],
  defaultVariants: { kind: "ok", appearance: "text" },
});

export type StatusKind = NonNullable<VariantProps<typeof statusBadgeVariants>["kind"]>;

function StatusBadge({
  className,
  kind,
  appearance,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ kind, appearance }), className)}
      {...props}
    />
  );
}

export { StatusBadge, statusBadgeVariants };
