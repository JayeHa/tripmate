"use client";

import { type KeyboardEvent, type RefObject, useState } from "react";

import {
  acceptHour,
  acceptMinute,
  commitTime,
  pad2,
  splitTime,
  splitValue,
  stepPart,
} from "./time-input";

/** 틀린 칸 */
type TimeError = "hour" | "minute" | null;

/** 시 · 분 입력칸 — 칸을 그리는 쪽이 만들어 넘긴다(포커스를 옮길 때 쓴다) */
type TimeInputRefs = {
  hourRef: RefObject<HTMLInputElement | null>;
  minuteRef: RefObject<HTMLInputElement | null>;
};

/**
 * 시간 칸(TimeField)의 상태 — 시 · 분 두 칸에 직접 치고, 칸 밖으로 나가면(blur) 확정해 onChange 를 부른다.
 * 저장된 값이 밖에서 바뀌면(다시 열기 · 다른 일정) 그 값으로 다시 채운다. 규칙은 time-input.ts
 */
export function useTimeInput(
  value: string,
  onChange: (value: string) => void,
  { hourRef, minuteRef }: TimeInputRefs,
) {
  const [shown, setShown] = useState(value);
  const [hour, setHour] = useState(() => splitValue(value).hour);
  const [minute, setMinute] = useState(() => splitValue(value).minute);
  const [error, setError] = useState<TimeError>(null);
  if (value !== shown) {
    setShown(value);
    setHour(splitValue(value).hour);
    setMinute(splitValue(value).minute);
    setError(null);
  }

  /**
   * 지금 칸 값으로 확정한다 — 맞으면 두 자리로 채우고 저장한다. 틀리면 그 칸 오류를 띄우고 친 그대로(「:30」 · 「25:00」)를
   * 넘긴다 — 폼이 옛 시간을 그대로 저장하지 않고 저장 때 isTimeValue 로 거부하게
   */
  function commit(h = hour, m = minute) {
    const result = commitTime(h, m);
    if ("error" in result) {
      const raw = `${h}:${m}`;
      setError(result.error);
      setShown(raw);
      if (raw !== value) onChange(raw);
      return;
    }
    setError(null);
    setHour(splitValue(result.value).hour);
    setMinute(splitValue(result.value).minute);
    setShown(result.value);
    if (result.value !== value) onChange(result.value);
  }

  /** 붙여넣거나 몰아 친 시간을 두 칸에 나눠 넣는다. 시간 모양이 아니면 false */
  function fill(text: string): boolean {
    const parts = splitTime(text);
    if (!parts) return false;
    setHour(parts.hour);
    setMinute(parts.minute);
    // 붙여넣은 값이 범위를 벗어나면(「25:00」) 바로 알린다
    const result = commitTime(parts.hour, parts.minute);
    setError("error" in result ? result.error : null);
    minuteRef.current?.focus();
    return true;
  }

  /** ↑↓(Shift 면 분 ±10)로 한 칸을 바꾼다 */
  function step(e: KeyboardEvent, part: "hour" | "minute") {
    const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey && part === "minute" ? 10 : 1);
    e.preventDefault();
    if (part === "hour") setHour((h) => stepPart(h, delta, 23));
    else setMinute((m) => stepPart(m, delta, 59));
    setError(null);
  }

  return {
    hour,
    minute,
    error,
    typeHour: (raw: string) => {
      if (raw.replace(/\D/g, "").length > 2 && fill(raw)) return;
      const next = acceptHour(raw);
      setHour(next.text);
      setError(null);
      if (next.done) minuteRef.current?.focus();
    },
    typeMinute: (raw: string) => {
      if (raw.replace(/\D/g, "").length > 2 && fill(raw)) return;
      setMinute(acceptMinute(raw).text);
      setError(null);
    },
    /** 시 칸 키 — 「:」 · 공백이면 한 자리 시를 0N 으로 채우고 분 칸으로, Enter 면 확정, ↑↓ */
    hourKey: (e: KeyboardEvent) => {
      if (e.key === ":" || e.key === " ") {
        e.preventDefault();
        if (hour.length === 1) setHour(pad2(hour));
        minuteRef.current?.focus();
      } else if (e.key === "Enter") commit();
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") step(e, "hour");
    },
    /** 분 칸 키 — 비었는데 지우기면 시 칸 끝으로, Enter 면 확정, ↑↓ */
    minuteKey: (e: KeyboardEvent) => {
      if (e.key === "Backspace" && minute === "") {
        e.preventDefault();
        const input = hourRef.current;
        input?.focus();
        input?.setSelectionRange(input.value.length, input.value.length);
      } else if (e.key === "Enter") commit();
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") step(e, "minute");
    },
    /** 붙여넣기 — 시간 모양이면 두 칸에 나눠 넣는다 */
    paste: (text: string) => fill(text),
    commit: () => commit(),
    /** ✕ — 시간 없음 */
    clear: () => {
      setHour("");
      setMinute("");
      setError(null);
      setShown("");
      if (value !== "") onChange("");
    },
  };
}

export type TimeInputState = ReturnType<typeof useTimeInput>;
