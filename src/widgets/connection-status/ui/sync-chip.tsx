"use client";

import { CircleAlert, CloudCheck, CloudOff, LoaderCircle, type LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { SyncChip as SyncChipState } from "../lib/chip";

/** 칩 종류마다 색 · 아이콘 · 글 */
const CHIP: Record<
  SyncChipState["kind"],
  { className: string; Icon: LucideIcon; label: (c: SyncChipState) => string }
> = {
  saving: {
    className: "bg-surface-muted text-ink-500",
    Icon: LoaderCircle,
    label: () => "저장 중…",
  },
  saved: {
    className: "bg-sync-saved-soft text-sync-saved",
    Icon: CloudCheck,
    label: () => "모두 저장됨",
  },
  waiting: {
    className: "bg-sync-waiting-soft text-sync-waiting",
    Icon: CloudOff,
    label: (c) => `변경 ${"count" in c ? c.count : 0}건 대기`,
  },
  failed: {
    className: "bg-destructive-soft text-destructive",
    Icon: CircleAlert,
    label: () => "저장 실패 · 다시 시도",
  },
};

type SyncChipProps = { chip: SyncChipState; onRetry: () => void };

/** 동기화 칩 하나(26 · r13 · 12/800 · 아이콘 13) — 「저장 실패 · 다시 시도」 만 버튼(누르면 다시 올린다) */
export function SyncChip({ chip, onRetry }: SyncChipProps) {
  const { className, Icon, label } = CHIP[chip.kind];
  const body = (
    <>
      <Icon
        className={cn("size-3.25", chip.kind === "saving" && "animate-spin")}
        aria-hidden="true"
      />
      {label(chip)}
    </>
  );
  const base = cn(
    "flex h-6.5 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold whitespace-nowrap",
    className,
  );
  if (chip.kind === "failed") {
    return (
      <button type="button" onClick={onRetry} className={cn(base, "pointer-events-auto")}>
        {body}
      </button>
    );
  }
  return (
    <span role="status" className={base}>
      {body}
    </span>
  );
}
