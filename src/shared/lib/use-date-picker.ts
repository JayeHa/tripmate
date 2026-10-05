"use client";

import { useState } from "react";

import { type DateSelection, pickDate } from "./calendar";
import { monthOf, shiftMonth, type YearMonth } from "./date-field";
import { todayISO } from "./days";

type DatePickerOptions = {
  mode: "single" | "range";
  /** 지금 칸의 값. 날짜 하나도 { start, end: start } 로 받는다 */
  value: DateSelection;
  /** 「확인」 · 「날짜 없음」 — 고른 값(날짜 없음은 null) */
  onCommit: (value: DateSelection) => void;
};

/**
 * 날짜 고르기 팝오버의 상태 — 열 때 지금 값을 초안으로 복사하고 그 달을 보인다. 날짜를 누르면 초안만 바뀌고
 * 「확인」 에서 넘긴다. 바깥을 누르거나 「취소」 로 닫으면 초안을 버린다(칸 값은 그대로).
 * 기간은 시작일 → 종료일 순서로 고르고, 시작일보다 앞을 누르면 시작일을 다시 고른다(pickDate)
 */
export function useDatePicker({ mode, value, onCommit }: DatePickerOptions) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateSelection>(value);
  const [month, setMonth] = useState<YearMonth>(() => monthOf(value?.start ?? todayISO()));

  /** 열 때 초안 · 보이는 달을 지금 값으로 맞춘다 */
  function onOpenChange(next: boolean) {
    if (next) {
      setDraft(value);
      setMonth(monthOf(value?.start ?? todayISO()));
    }
    setOpen(next);
  }

  /** 날짜 하나를 눌렀다 */
  function pick(date: string) {
    setDraft(mode === "single" ? { start: date, end: date } : pickDate(draft, date));
  }

  /** 초안을 넘기고 닫는다 */
  function confirm() {
    onCommit(draft);
    setOpen(false);
  }

  /** 날짜 하나는 「날짜 없음」 으로 바로 비우고 닫는다. 기간은 초안만 비운다(「초기화」) */
  function clear() {
    if (mode === "single") {
      onCommit(null);
      setOpen(false);
      return;
    }
    setDraft(null);
  }

  return {
    open,
    onOpenChange,
    close: () => setOpen(false),
    draft,
    month,
    prevMonth: () => setMonth((m) => shiftMonth(m, -1)),
    nextMonth: () => setMonth((m) => shiftMonth(m, 1)),
    pick,
    /** 확인할 수 있는지 — 날짜 하나는 고른 뒤, 기간은 종료일까지 고른 뒤 */
    ready: mode === "single" ? draft !== null : !!draft?.end,
    confirm,
    clear,
  };
}

export type DatePickerState = ReturnType<typeof useDatePicker>;
