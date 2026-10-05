"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import type { ScheduleEditState } from "../../model/use-schedule-edit";
import { DiscardConfirm } from "../discard-confirm";
import { EditList } from "../edit-list";
import { EditActionsBar } from "./edit-actions-bar";
import { EditDayHeader } from "./edit-day-header";

type MobileScheduleEditorProps = {
  edit: ScheduleEditState;
  startDate: string;
  totalDays: number;
  /** 편집하는 날의 지도(150 높이 칸을 채운다) */
  map: React.ReactNode;
};

/**
 * 모바일 일정 편집 — 화면 전체를 덮는다. [← 일정 편집 · 완료] · 그날 지도 150 · 하루 목록 · 「day 전체 선택」,
 * 고른 게 있으면 아래에 「N개 선택 · 날짜 이동 · 삭제」. 바꾼 게 있는데 ← 를 누르면 버릴지 묻는다
 */
export function MobileScheduleEditor({
  edit,
  startDate,
  totalDays,
  map,
}: MobileScheduleEditorProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="fixed inset-x-0 top-(--shell-top) bottom-0 z-40 flex flex-col bg-white">
      <div className="flex h-13 shrink-0 items-center gap-3.5 px-5">
        <button
          type="button"
          aria-label="편집 취소"
          disabled={edit.saving}
          onClick={() => (edit.dirty ? setConfirming(true) : edit.discard())}
          className="flex text-ink-900 disabled:opacity-40"
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-lg font-bold text-ink-900">일정 편집</h1>
        <button
          type="button"
          disabled={edit.saving}
          onClick={edit.done}
          className="text-base font-bold text-primary disabled:opacity-40"
        >
          완료
        </button>
      </div>
      <div className="relative h-37.5 shrink-0 bg-map-bg">{map}</div>
      <div inert={edit.saving} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8">
        <EditDayHeader
          startDate={startDate}
          totalDays={totalDays}
          day={edit.day}
          onDayChange={edit.setDay}
        />
        {edit.rows.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">이 날은 일정이 비어 있어요</p>
        )}
        <EditList edit={edit} layout="mobile" />
        {edit.rows.some((r) => r.kind !== "flight") && (
          <div className="px-5 pt-2.5 pb-2">
            <button
              type="button"
              onClick={edit.toggleAll}
              className="h-11 w-full rounded-button border border-line-strong text-[15px] font-bold text-ink-900"
            >
              {edit.allSelected ? "day 전체 해제" : "day 전체 선택"}
            </button>
          </div>
        )}
        {edit.error && <p className="px-5 pt-2 text-[13px] text-destructive">{edit.error}</p>}
      </div>
      <EditActionsBar edit={edit} startDate={startDate} totalDays={totalDays} />
      <DiscardConfirm open={confirming} onOpenChange={setConfirming} onDiscard={edit.discard} />
    </div>
  );
}
