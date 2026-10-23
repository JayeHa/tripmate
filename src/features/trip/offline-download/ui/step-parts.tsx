"use client";

import { format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** 상태 아이콘의 색 — 받기 · 다시 받기는 파랑, 받는 중 주황, 완료 초록, 실패 빨강(동기화 칩과 같은 색) */
const TONE = {
  blue: "bg-primary-tint text-primary",
  busy: "bg-sync-waiting-soft text-sync-waiting",
  done: "bg-sync-saved-soft text-sync-saved",
  fail: "bg-destructive-soft text-destructive",
} as const;

type StatusIconProps = { icon: LucideIcon; tone: keyof typeof TONE; spin?: boolean };

/** 창 맨 위 상태 아이콘 — 40 원 · 아이콘 20 */
export function StatusIcon({ icon: Icon, tone, spin }: StatusIconProps) {
  return (
    <span
      className={cn("mb-1.5 flex size-10 items-center justify-center rounded-full", TONE[tone])}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={2.2}
        className={cn("size-5", spin && "animate-spin animation-duration-[1s]")}
      />
    </span>
  );
}

/** 「11.5」 — 보관 기한 줄 */
export const shortDate = (date: string) => format(parseISO(date), "M.d");
