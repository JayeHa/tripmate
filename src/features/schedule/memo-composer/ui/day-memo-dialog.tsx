"use client";

import { ChevronDown, ChevronUp, NotebookPen, Star } from "lucide-react";
import { useState } from "react";

import { MEMO_MAX } from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/ui/filter-chip";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { useDayMemo } from "../model/use-day-memo";

type DayMemoDialogProps = {
  tripId: string;
  startDate: string;
  totalDays: number;
  /** 처음 고른 날(보고 있던 날) */
  dayIndex: number;
  onClose: () => void;
};

/**
 * 날짜 메모 쓰기 — 대상(「day N 메모 · 날짜 · 일정 맨 아래에 추가돼요」 + 「변경 ⌄」 으로 날짜 바꾸기) · ☆ 중요 · 글(500자).
 * 저장하면 그날 맨 끝에 메모 한 줄이 생긴다. 장소 메모는 일정 상세의 「+ 메모」 에서 쓴다
 */
export function DayMemoDialog(props: DayMemoDialogProps) {
  const [locked, setLocked] = useState(false);
  return (
    <SheetDialog open onClose={props.onClose} title="메모 추가" locked={locked}>
      <DayMemoBody {...props} onLockChange={setLocked} />
    </SheetDialog>
  );
}

type DayMemoBodyProps = DayMemoDialogProps & { onLockChange: (locked: boolean) => void };

/** 칸 묶음. 상태는 useDayMemo */
function DayMemoBody({
  tripId,
  startDate,
  totalDays,
  dayIndex,
  onClose,
  onLockChange,
}: DayMemoBodyProps) {
  const form = useDayMemo(tripId, dayIndex, onClose);
  const [picking, setPicking] = useState(false);
  useReportLock(form.locked, onLockChange);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 rounded-card bg-surface-sunken px-3.5 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-500">
          <NotebookPen className="size-3.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-bold text-ink-900">day {form.dayIndex + 1} 메모</span>
          <span className="text-xs text-ink-400">
            {dayLabel(startDate, form.dayIndex)} · 일정 맨 아래에 추가돼요
          </span>
        </div>
        <button
          type="button"
          aria-expanded={picking}
          onClick={() => setPicking((p) => !p)}
          className="flex items-center gap-0.5 text-[13px] font-bold text-primary"
        >
          변경
          {picking ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>
      {picking && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalDays }, (_, day) => day).map((i) => (
            <FilterChip
              key={i}
              size="lg"
              selected={i === form.dayIndex}
              onClick={() => {
                form.setDayIndex(i);
                setPicking(false);
              }}
            >
              day {i + 1}
            </FilterChip>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-pressed={form.starred}
        onClick={form.toggleStar}
        className={cn(
          "flex h-8 items-center gap-1 self-start rounded-full border px-3 text-[13px] font-bold",
          form.starred
            ? "border-important-line bg-important-bg text-important-text"
            : "border-line bg-white text-ink-500",
        )}
      >
        <Star className={cn("size-3.5", form.starred && "fill-current")} />
        중요
      </button>
      <div className="flex flex-col gap-1">
        <textarea
          value={form.body}
          onChange={(e) => form.setBody(e.target.value)}
          maxLength={MEMO_MAX}
          rows={5}
          aria-label="메모"
          placeholder={
            form.starred
              ? "예) 18:50까지 7층 매장 앞 집합 — 늦으면 정리번호 무효"
              : "메모를 입력하세요"
          }
          className="w-full resize-none rounded-memo border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none focus:border-primary"
        />
        <span className="self-end text-xs text-ink-350">
          {form.body.length}/{MEMO_MAX}
        </span>
      </div>
      {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
      <div className="flex gap-2">
        <Button
          variant="chip"
          size="form"
          className="flex-1"
          disabled={form.locked}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="form"
          className="flex-2"
          disabled={!form.canSave || form.pending}
          onClick={form.save}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
