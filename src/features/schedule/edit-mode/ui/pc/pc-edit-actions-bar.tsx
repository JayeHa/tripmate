"use client";

import { CalendarDays, ChevronUp, Trash2 } from "lucide-react";

import { dayLabel } from "@/shared/lib/days";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { ScheduleEditState } from "../../model/use-schedule-edit";

type PcEditActionsBarProps = { edit: ScheduleEditState; startDate: string; totalDays: number };

/** PC 목록 칸 아래에 붙는 줄 — 「N개 선택」 · 날짜 이동(위로 여는 200 메뉴) · 삭제 */
export function PcEditActionsBar({ edit, startDate, totalDays }: PcEditActionsBarProps) {
  if (edit.selected.size === 0) return null;
  const days = Array.from({ length: totalDays }, (_, i) => i).filter((d) => d !== edit.day);
  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-divider bg-white px-5 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.06)]">
      <span className="flex-1 text-sm font-bold text-ink-900">{edit.selected.size}개 선택</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={days.length === 0}
          className="flex h-9.5 items-center gap-1.5 rounded-button border border-line-strong px-3.5 text-sm font-bold text-ink-900 hover:bg-surface-sunken disabled:opacity-40"
        >
          <CalendarDays className="size-4" />
          날짜 이동
          <ChevronUp className="size-3.5 text-ink-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="w-50 rounded-card border border-divider bg-white p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.16)] ring-0"
        >
          {days.map((d) => (
            <DropdownMenuItem
              key={d}
              onClick={() => edit.moveSelected(d)}
              className="flex h-10 justify-between rounded-button px-3 text-sm font-bold text-ink-900"
            >
              day {d + 1}
              <span className="text-[13px] font-medium text-ink-400">{dayLabel(startDate, d)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        onClick={edit.removeSelected}
        className="flex h-9.5 items-center gap-1.5 rounded-button bg-destructive-soft px-3.5 text-sm font-bold text-destructive"
      >
        <Trash2 className="size-4" />
        삭제
      </button>
    </div>
  );
}
