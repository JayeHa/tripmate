"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

import type { ScheduleEditState } from "../../model/use-schedule-edit";
import { DiscardConfirm } from "../discard-confirm";
import { EditDaySelect } from "../edit-day-select";
import { EditList } from "../edit-list";
import { SummaryField } from "../summary-field";
import { PcEditActionsBar } from "./pc-edit-actions-bar";

type PcScheduleEditorProps = { edit: ScheduleEditState; startDate: string; totalDays: number };

/**
 * PC 일정 편집 — 목록 칸을 이걸로 바꾼다(지도 · 날짜 레일은 그대로). 위에 붙는 머리(제목 · 취소 · 완료,
 * 전체 선택 · 날짜 고르기), 하루 목록, 고른 게 있으면 아래에 붙는 줄. 바꾼 게 있는데 취소하면 버릴지 묻는다
 */
export function PcScheduleEditor({ edit, startDate, totalDays }: PcScheduleEditorProps) {
  const [confirming, setConfirming] = useState(false);
  const { date, dow } = dayParts(startDate, edit.day);
  const canSelect = edit.rows.some((r) => r.kind !== "flight");
  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-divider bg-white px-5 pt-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink-900">
              일정 편집
            </h2>
            <span className="text-[13px] text-ink-400">
              day {edit.day + 1} · {date}/{dow}
            </span>
          </div>
          <button
            type="button"
            disabled={edit.saving}
            onClick={() => (edit.dirty ? setConfirming(true) : edit.discard())}
            className="h-9 rounded-button border border-line-strong px-3.5 text-sm font-bold text-ink-700 hover:bg-surface-sunken disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            disabled={edit.saving}
            onClick={edit.done}
            className="h-9 rounded-button bg-primary px-4 text-sm font-bold text-white hover:bg-primary-pressed disabled:bg-primary-disabled"
          >
            완료
          </button>
        </div>
        <SummaryField value={edit.summary} onChange={edit.setSummary} layout="pc" />
        <div inert={edit.saving} className="flex items-center justify-between">
          <button
            type="button"
            role="checkbox"
            aria-checked={edit.allSelected}
            disabled={!canSelect}
            onClick={edit.toggleAll}
            className="flex items-center gap-2 text-sm font-bold text-ink-700 disabled:opacity-40"
          >
            <span
              className={cn(
                "flex size-5.5 items-center justify-center rounded-full border",
                edit.allSelected ? "border-primary bg-primary" : "border-handle bg-white",
              )}
            >
              {edit.allSelected && <Check className="size-3.25 text-white" strokeWidth={3} />}
            </span>
            {edit.allSelected ? "day 전체 해제" : "day 전체 선택"}
          </button>
          <EditDaySelect
            startDate={startDate}
            totalDays={totalDays}
            day={edit.day}
            onChange={edit.setDay}
          />
        </div>
        {edit.error && <p className="text-[13px] text-destructive">{edit.error}</p>}
      </div>
      <div inert={edit.saving} className="flex-1 pt-2.5 pb-4">
        {edit.rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-400">이 날은 일정이 비어 있어요</p>
        )}
        <EditList edit={edit} layout="pc" />
      </div>
      <PcEditActionsBar edit={edit} startDate={startDate} totalDays={totalDays} />
      <DiscardConfirm open={confirming} onOpenChange={setConfirming} onDiscard={edit.discard} />
    </div>
  );
}
