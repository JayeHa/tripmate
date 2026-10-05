"use client";

import { Rows3, Square } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { DayViewMode } from "../../model/use-pc-day-view";

/** 세그먼트 두 칸 — 보기 · 이름 · 아이콘 */
const MODES = [
  { mode: "all", label: "이어서", Icon: Rows3 },
  { mode: "one", label: "하루씩", Icon: Square },
] as const;

type DayViewToggleProps = {
  mode: DayViewMode;
  onChange: (mode: DayViewMode) => void;
  /** 처음 하루씩으로 바꿨을 때의 말풍선 */
  tip: boolean;
  onTipDismiss: () => void;
};

/**
 * 날짜 레일 제목 아래 「이어서 / 하루씩」 2칸 세그먼트(32 · 회색 트랙 · 고른 칸은 흰 thumb + 그림자).
 * tip 이면 바로 아래에 잉크 말풍선(252)을 띄운다 — 「알겠어요」 를 누를 때까지 남는다
 */
export function DayViewToggle({ mode, onChange, tip, onTipDismiss }: DayViewToggleProps) {
  return (
    <div className="relative mt-2.5">
      <div
        role="group"
        aria-label="일정 보기"
        className="grid h-8 grid-cols-2 rounded-button bg-surface-muted p-0.75"
      >
        {MODES.map(({ mode: m, label, Icon }) => (
          <button
            key={m}
            type="button"
            aria-pressed={m === mode}
            onClick={() => onChange(m)}
            className={cn(
              "flex items-center justify-center gap-1 rounded-pill-sm text-[13px] font-bold",
              m === mode
                ? "bg-white text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,.08)]"
                : "text-ink-450",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {tip && (
        <div
          role="status"
          className="absolute top-10 left-0 z-30 flex w-63 flex-col gap-2.5 rounded-card bg-ink-900 px-3.5 pt-3.5 pb-3 text-white shadow-[0_6px_20px_rgba(0,0,0,.18)]"
        >
          {/* 「하루씩」 칸을 가리키는 꼬리 */}
          <span
            aria-hidden="true"
            className="absolute -top-1.5 left-37.5 size-3 rotate-45 bg-ink-900"
          />
          <span className="text-sm font-extrabold">하루씩 보기</span>
          <span className="text-[13px]/[1.55] text-line">
            이 날의 일정만 보여요. 다음 날은 아래 날짜를 누르거나 목록 끝 「다음 날 ›」로 넘어가요.
          </span>
          <button
            type="button"
            onClick={onTipDismiss}
            className="h-7.5 self-end rounded-[15px] bg-white px-3 text-[13px] font-bold text-ink-900"
          >
            알겠어요
          </button>
        </div>
      )}
    </div>
  );
}
