"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

import { minuteSteps, padTime } from "@/shared/lib/time-draft";
import type { TimePickerState } from "@/shared/lib/use-time-picker";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type TimePickerPanelProps = { picker: TimePickerState; step: number };

/**
 * 시간 선택 창의 안쪽 — 미리보기(「16:00」 · 「--:--」) · 시 드롭다운 : 분 콤보박스(목록 + 직접 입력) · 「시간 없음 | 확인」.
 * 시 · 분 목록은 칸 바로 아래에 뜨는 직접 만든 목록이다(네이티브 select 를 쓰지 않는다)
 */
export function TimePickerPanel({ picker: p, step }: TimePickerPanelProps) {
  const field = (on: boolean) =>
    cn(
      "flex h-12 items-center rounded-memo bg-white",
      on ? "border-[1.5px] border-primary" : "border border-line",
    );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span
          className={cn(
            "text-[26px] font-extrabold tracking-[-0.02em]",
            p.canConfirm ? "text-ink-900" : "text-handle",
          )}
        >
          {p.preview}
        </span>
        {p.hint && <span className="text-xs text-ink-400">{p.hint}</span>}
      </div>
      <div className="flex items-end gap-2">
        <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-400">시</span>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={p.list === "hour"}
            onClick={() => p.toggleList("hour")}
            className={cn(field(p.list === "hour"), "pr-3 pl-3.5")}
          >
            <span
              className={cn(
                "flex-1 text-left text-[17px] font-bold",
                p.draft.h === null ? "text-ink-350" : "text-ink-900",
              )}
            >
              {p.draft.h === null ? "시" : `${padTime(p.draft.h)}시`}
            </span>
            <ChevronDown className="size-4.5 text-ink-500" />
          </button>
          {p.list === "hour" && (
            <OptionList
              options={Array.from({ length: 24 }, (_, h) => ({
                value: h,
                label: `${padTime(h)}시`,
              }))}
              selected={p.draft.h}
              onPick={p.pickHour}
            />
          )}
        </div>
        <span className="pb-3 text-xl font-extrabold text-ink-350">:</span>
        <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-400">
            분 <span className="font-medium text-handle">· 직접 입력 가능</span>
          </span>
          <div className={cn(field(p.list === "minute"), "gap-1 pr-1.5 pl-3.5")}>
            <input
              value={p.minuteInput}
              onChange={(e) => p.typeMinute(e.target.value)}
              onFocus={p.openMinuteList}
              inputMode="numeric"
              maxLength={2}
              placeholder="--"
              aria-label="분"
              className="w-7 bg-transparent p-0 text-[17px] font-bold text-ink-900 outline-none"
            />
            <span className="flex-1 text-[17px] font-bold text-ink-400">분</span>
            <button
              type="button"
              aria-label="분 목록"
              aria-expanded={p.list === "minute"}
              onClick={() => p.toggleList("minute")}
              className="flex h-9 w-7.5 items-center justify-center"
            >
              <ChevronDown className="size-4.5 text-ink-500" />
            </button>
          </div>
          {p.list === "minute" && (
            <OptionList
              options={minuteSteps(step).map((m) => ({ value: m, label: `${padTime(m)}분` }))}
              selected={p.draft.h === null ? null : p.draft.m}
              onPick={p.pickMinute}
            />
          )}
          {p.outOfRange && (
            <span className="text-xs font-semibold text-destructive">
              00–59 사이로 입력해 주세요
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-0.5">
        <Button variant="chip" size="form" className="h-10 flex-1" onClick={p.clear}>
          시간 없음
        </Button>
        <Button size="form" className="h-10 flex-1" disabled={!p.canConfirm} onClick={p.confirm}>
          확인
        </Button>
      </div>
    </div>
  );
}

type OptionListProps = {
  options: { value: number; label: string }[];
  selected: number | null;
  onPick: (value: number) => void;
};

/** 칸 아래 4px 에 뜨는 목록(최대 216 스크롤). 고른 값은 연파랑 바탕 · 굵은 파랑 · ✓ 이고, 열면 그 줄이 보이게 스크롤한다 */
function OptionList({ options, selected, onPick }: OptionListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  // 목록 안만 스크롤한다 — scrollIntoView 는 뒤의 창 · 페이지까지 움직인다
  useEffect(() => {
    const list = listRef.current;
    const row = selectedRef.current;
    if (list && row) list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
  }, []);
  return (
    <div
      ref={listRef}
      role="listbox"
      className="absolute inset-x-0 top-full z-10 mt-1 max-h-54 overflow-y-auto rounded-card border border-divider bg-white p-1 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
    >
      {options.map((o) => {
        const on = o.value === selected;
        return (
          <button
            key={o.value}
            ref={on ? selectedRef : undefined}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onPick(o.value)}
            className={cn(
              "flex h-10 w-full items-center gap-1.5 rounded-button px-2.5 text-[15px]",
              on
                ? "bg-surface-memo font-extrabold text-primary"
                : "font-medium text-ink-900 hover:bg-surface-sunken",
            )}
          >
            <span className="flex-1 text-left">{o.label}</span>
            {on && <Check className="size-4" />}
          </button>
        );
      })}
    </div>
  );
}
