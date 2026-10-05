"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { useState } from "react";

import { dayLabel } from "@/shared/lib/days";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { ScheduleEditState } from "../../model/use-schedule-edit";

type EditActionsBarProps = { edit: ScheduleEditState; startDate: string; totalDays: number };

/**
 * 고른 게 있을 때 아래에 붙는 줄 — 「N개 선택」 · 날짜 이동(「어느 날로 옮길까요?」 → 그날 맨 끝) · 삭제.
 * 둘 다 초안만 바꾸고 「완료」 에서 저장된다
 */
export function EditActionsBar({ edit, startDate, totalDays }: EditActionsBarProps) {
  const [moving, setMoving] = useState(false);
  if (edit.selected.size === 0) return null;
  const days = Array.from({ length: totalDays }, (_, i) => i).filter((d) => d !== edit.day);
  return (
    <div
      inert={edit.saving}
      className="flex shrink-0 items-center gap-2 border-t border-divider bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.06)]"
    >
      <span className="flex-1 text-[15px] font-bold text-ink-900">{edit.selected.size}개 선택</span>
      <button
        type="button"
        disabled={days.length === 0}
        onClick={() => setMoving(true)}
        className="flex h-11 items-center gap-1.5 rounded-button border border-line-strong px-4 text-[15px] font-bold text-ink-900 disabled:opacity-40"
      >
        <CalendarDays className="size-4.5" />
        날짜 이동
      </button>
      <button
        type="button"
        onClick={edit.removeSelected}
        className="flex h-11 items-center gap-1.5 rounded-button bg-destructive-soft px-4 text-[15px] font-bold text-destructive"
      >
        <Trash2 className="size-4.5" />
        삭제
      </button>
      <SheetDialog open={moving} onClose={() => setMoving(false)} title="어느 날로 옮길까요?">
        <div className="flex flex-col gap-1.5">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                edit.moveSelected(d);
                setMoving(false);
              }}
              className="flex h-13 items-center justify-between rounded-card bg-surface-sunken px-4 text-base font-bold text-ink-900"
            >
              day {d + 1}
              <span className="text-sm font-semibold text-ink-400">{dayLabel(startDate, d)}</span>
            </button>
          ))}
        </div>
      </SheetDialog>
    </div>
  );
}
