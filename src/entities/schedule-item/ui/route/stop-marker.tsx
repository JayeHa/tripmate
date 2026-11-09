import { Check } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { StopKind } from "../../lib/route-day";

/** 역의 상태 — 계획 모드 · 기록 모드의 다녀옴 · 지금 여기 · 남음 */
export type StopTone = "plan" | "done" | "current" | "todo";

/** 계획 모드 표식 — 종류마다 크기 · 테두리 */
const PLAN: Record<StopKind, string> = {
  place: "size-5 border-4 border-route-stop",
  hub: "size-6.5 border-5 border-ink-900",
  opt: "size-5 border-3 border-dashed border-route-stop-opt",
};

/** 기록 모드 표식 */
const RECORD: Record<Exclude<StopTone, "plan">, string> = {
  done: "size-6 border-3 border-white bg-visited shadow-[0_0_0_2px_var(--color-visited)]",
  current: "size-6.5 border-5 border-visited shadow-[0_0_0_6px_rgba(16,185,129,.18)]",
  todo: "size-4.5 border-3 border-route-stop-todo",
};

type StopMarkerProps = {
  kind: StopKind;
  tone: StopTone;
  /** 펼쳤거나 고른 역 — 파란 링(계획 모드) */
  selected?: boolean;
  className?: string;
};

/** 노선도의 역 표식(흰 원 + 테두리). 다녀온 역은 초록 채움 + ✓ */
export function StopMarker({ kind, tone, selected = false, className }: StopMarkerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white",
        tone === "plan" ? PLAN[kind] : RECORD[tone],
        selected && tone === "plan" && "shadow-[0_0_0_6px_rgba(58,139,255,.18)]",
        className,
      )}
    >
      {tone === "done" && <Check className="size-3 text-white" strokeWidth={4} />}
    </span>
  );
}
