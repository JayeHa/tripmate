"use client";

import { useState } from "react";

import {
  draftValue,
  minuteOutOfRange,
  padTime,
  parseTime,
  pickHour,
  pickMinute,
  type TimeDraft,
  typeMinute,
} from "./time-draft";

/** 시 목록 · 분 목록 중 열린 것 */
type OpenList = "hour" | "minute" | null;

/**
 * 시간 선택 창(TimeField)의 상태. 창을 열 때 지금 값으로 시작하고, 「확인」 해야 값이 바뀐다(바깥을 누르면 그대로).
 * 시 · 분은 목록에서 고르거나 분은 직접 친다 — 규칙은 time-draft.ts
 */
export function useTimePicker(value: string, onChange: (value: string) => void) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TimeDraft>(() => parseTime(value));
  // 분 칸에 직접 친 글자. null 이면 고른 분을 두 자리로 보인다
  const [minuteText, setMinuteText] = useState<string | null>(null);
  const [list, setList] = useState<OpenList>(null);

  const result = draftValue(draft, minuteText);
  const outOfRange = minuteOutOfRange(minuteText);

  /** 창을 열고 닫는다. 열 때마다 지금 값에서 다시 시작한다 */
  function setPanelOpen(next: boolean) {
    if (next) {
      setDraft(parseTime(value));
      setMinuteText(null);
      setList(null);
    }
    setOpen(next);
  }

  return {
    open,
    setOpen: setPanelOpen,
    draft,
    list,
    /** 시 · 분 목록을 열고 닫는다(하나만 열린다) */
    toggleList: (which: Exclude<OpenList, null>) => setList((l) => (l === which ? null : which)),
    openMinuteList: () => setList("minute"),
    closeLists: () => setList(null),
    pickHour: (h: number) => {
      setDraft((d) => pickHour(d, h));
      setMinuteText(null);
      setList(null);
    },
    pickMinute: (m: number) => {
      setDraft((d) => pickMinute(d, m));
      setMinuteText(null);
      setList(null);
    },
    typeMinute: (raw: string) => {
      const next = typeMinute(draft, raw);
      setDraft(next.draft);
      setMinuteText(next.text);
    },
    /** 분 칸에 보일 글자 */
    minuteInput: minuteText ?? (draft.m === null || draft.h === null ? "" : padTime(draft.m)),
    /** 미리보기 「16:00」. 고르기 전 「--:--」, 분이 범위 밖이면 「16:--」 */
    preview: result || (outOfRange && draft.h !== null ? `${padTime(draft.h)}:--` : "--:--"),
    hint: draft.h === null ? "시를 먼저 골라 주세요" : null,
    outOfRange,
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
