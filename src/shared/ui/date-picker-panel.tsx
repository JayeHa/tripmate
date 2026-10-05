"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { pickerCells, rangeHint } from "@/shared/lib/date-field";
import { todayISO } from "@/shared/lib/days";
import type { DatePickerState } from "@/shared/lib/use-date-picker";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { DatePickerGrid } from "./date-picker-grid";

type DatePickerPanelProps = {
  picker: DatePickerState;
  mode: "single" | "range";
  /** 비울 수 없는 칸 — 왼쪽 버튼이 「취소」 */
  required: boolean;
  min?: string;
};

/**
 * 날짜 고르기 팝오버 안 — (기간이면 위 안내) · 「‹ 2026년 10월 ›」 · 달력 · 버튼 줄.
 * 왼쪽 버튼: 날짜 하나 「날짜 없음」 · 기간 「초기화」 · 비울 수 없으면 「취소」. 오른쪽 「확인」 은 다 고른 뒤에만 눌린다
 */
export function DatePickerPanel({ picker, mode, required, min }: DatePickerPanelProps) {
  const [year, month] = picker.month;
  const hint = mode === "range" ? rangeHint(picker.draft) : null;
  return (
    <>
      {hint && (
        <p
          className={cn(
            "text-[13px] font-bold",
            hint.done ? "text-primary-pressed" : "text-ink-700",
          )}
        >
          {hint.text}
        </p>
      )}
      <div className="flex items-center justify-between">
        <MonthButton label="이전 달" onClick={picker.prevMonth}>
          <ChevronLeft className="size-4.5" />
        </MonthButton>
        <span className="text-[15px] font-extrabold text-ink-900">
          {year}년 {month}월
        </span>
        <MonthButton label="다음 달" onClick={picker.nextMonth}>
          <ChevronRight className="size-4.5" />
        </MonthButton>
      </div>
      <DatePickerGrid
        cells={pickerCells(picker.month, { today: todayISO(), selection: picker.draft, min })}
        onPick={picker.pick}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="chip"
          size="form"
          className="h-10 flex-1"
          onClick={required ? picker.close : picker.clear}
        >
          {clearLabel(mode, required)}
        </Button>
        <Button
          type="button"
          size="form"
          className="h-10 flex-1"
          disabled={!picker.ready}
          onClick={picker.confirm}
        >
          확인
        </Button>
      </div>
    </>
  );
}

/** 왼쪽 버튼 글 */
function clearLabel(mode: "single" | "range", required: boolean) {
  if (required) return "취소";
  return mode === "single" ? "날짜 없음" : "초기화";
}

type MonthButtonProps = { label: string; onClick: () => void; children: React.ReactNode };

/** 달 넘기기 버튼 34 */
function MonthButton({ label, onClick, children }: MonthButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8.5 items-center justify-center rounded-button text-ink-700 hover:bg-surface-sunken"
    >
      {children}
    </button>
  );
}
