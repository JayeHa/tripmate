"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";

import { dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

type AddScheduleHeaderProps = {
  startDate: string;
  totalDays: number;
  dayIndex: number;
  onDayChange: (day: number) => void;
  onClose: () => void;
  /** 다이얼로그 제목(접근성 이름). 감싸는 쪽의 DialogTitle 을 넘긴다 */
  Title: React.ComponentType<{ className?: string; children: React.ReactNode }>;
};

/**
 * ✕ · 「일정 추가」 · 「day N · 10.31 (토)에 추가 ⌄」. 날짜 줄을 누르면 day 칩이 펼쳐져 담을 날을 바꾼다.
 */
export function AddScheduleHeader({
  startDate,
  totalDays,
  dayIndex,
  onDayChange,
  onClose,
  Title,
}: AddScheduleHeaderProps) {
  const [open, setOpen] = useState(false);
  const { date, dow } = dayParts(startDate, dayIndex);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <>
      <div className="flex h-13 shrink-0 items-center gap-3 px-4.5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6" strokeWidth={2} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-px">
          <Title className="text-[17px] font-extrabold text-ink-900">일정 추가</Title>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "flex h-5.5 items-center gap-0.5 rounded-full pr-1.5 pl-2.5 text-xs font-semibold",
              open ? "bg-status-ok-bg text-status-ok" : "text-ink-400",
            )}
          >
            day {dayIndex + 1} · {date} ({dow})에 추가
            <Chevron className="size-3.5" strokeWidth={2.2} />
          </button>
        </div>
        <span className="w-6" />
      </div>
      {open && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pt-1 pb-3">
          {Array.from({ length: totalDays }, (_, i) => {
            const day = dayParts(startDate, i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={i === dayIndex}
                onClick={() => {
                  onDayChange(i);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-12 min-w-15 flex-1 flex-col items-center justify-center gap-px rounded-card",
                  i === dayIndex ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-600",
                )}
              >
                <span className="text-[13px] font-extrabold">day {i + 1}</span>
                <span className="text-[11px] opacity-75">{day.date}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
