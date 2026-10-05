"use client";

import { useState } from "react";

import {
  draftValue,
  hourOutOfRange,
  minuteOutOfRange,
  padTime,
  parseTime,
  type TimeDraft,
  typeHour,
  typeMinute,
} from "./time-draft";

/**
 * 시간 선택 창(TimeField)의 상태. 창을 열 때 지금 값으로 시작하고, 「확인」 해야 값이 바뀐다(바깥을 누르면 그대로).
 * 시 · 분은 키보드로 친다(목록 없음) — 규칙은 time-draft.ts
 */
export function useTimePicker(value: string, onChange: (value: string) => void) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TimeDraft>(() => parseTime(value));
  // 시 · 분 칸에 직접 친 글자. null 이면 지금 값을 두 자리로 보인다
  const [hourText, setHourText] = useState<string | null>(null);
  const [minuteText, setMinuteText] = useState<string | null>(null);

  const result = draftValue(draft, minuteText, hourText);

  /** 창을 열고 닫는다. 열 때마다 지금 값에서 다시 시작한다 */
  function setPanelOpen(next: boolean) {
    if (next) {
      setDraft(parseTime(value));
      setHourText(null);
      setMinuteText(null);
    }
    setOpen(next);
  }

  return {
    open,
    setOpen: setPanelOpen,
    typeHour: (raw: string) => {
      const next = typeHour(draft, raw);
      setDraft(next.draft);
      setHourText(next.text);
    },
    typeMinute: (raw: string) => {
      const next = typeMinute(draft, raw);
      setDraft(next.draft);
      setMinuteText(next.text);
    },
    /** 시 칸에 보일 글자 */
    hourInput: hourText ?? (draft.h === null ? "" : padTime(draft.h)),
    /** 분 칸에 보일 글자 */
    minuteInput: minuteText ?? (draft.m === null || draft.h === null ? "" : padTime(draft.m)),
    /** 미리보기 「16:00」. 고르기 전 「--:--」, 분 칸이 비었거나 범위 밖이면 「16:--」 */
    preview: result || (draft.h !== null ? `${padTime(draft.h)}:--` : "--:--"),
    // 시 칸에 무언가 쳤으면(범위 밖 안내가 대신 뜬다) 치라는 안내는 숨긴다
    hint: draft.h === null && !hourText ? "시를 먼저 입력해 주세요" : null,
    hourOutOfRange: hourOutOfRange(hourText),
    minuteOutOfRange: minuteOutOfRange(minuteText),
    canConfirm: result !== "",
    confirm: () => {
      if (!result) return;
      onChange(result);
      setOpen(false);
    },
    /** 「시간 없음」 — 값을 지우고 닫는다 */
    clear: () => {
      onChange("");
      setOpen(false);
    },
  };
}

export type TimePickerState = ReturnType<typeof useTimePicker>;
