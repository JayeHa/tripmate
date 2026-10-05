"use client";

import { Clock, X } from "lucide-react";
import { type ClipboardEvent, type FocusEvent, useRef } from "react";

import { timeErrorText } from "@/shared/lib/time-input";
import { useTimeInput } from "@/shared/lib/use-time-input";
import { cn } from "@/shared/lib/utils";

type TimeFieldProps = {
  /** 「HH:MM」 또는 ""(시간 없음) */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
};

/** 숫자 칸 공통 — 폭 28 · 가운데 · 15/700 */
const NUMBER =
  "w-7 bg-transparent p-0 text-center text-[15px] font-bold text-ink-900 outline-none placeholder:text-ink-350 disabled:opacity-40";

/**
 * 시간 칸 — 브라우저 기본 시간 입력 대신 쓴다. 칸 안에서 「[시] 시 : [분] 분」 을 바로 치고, 칸 밖으로 나가면 확정한다
 * (팝오버 · 목록 · 확인 버튼 없음). 값이 있으면 오른쪽 ✕ 로 시간 없음. 범위를 벗어나면 빨간 테두리 · 안내만 보이고 저장하지 않는다
 */
export function TimeField({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  "aria-label": ariaLabel = "시간",
}: TimeFieldProps) {
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const t = useTimeInput(value, onChange, { hourRef, minuteRef });
  const filled = t.hour !== "" || t.minute !== "";

  /** 칸 묶음 밖으로 나갈 때만 확정한다(시 → 분 이동은 그대로) */
  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) t.commit();
  }

  /** 붙여넣기가 시간 모양이면 두 칸에 나눠 넣는다 */
  function onPaste(e: ClipboardEvent) {
    if (t.paste(e.clipboardData.getData("text"))) e.preventDefault();
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        role="group"
        aria-label={ariaLabel}
        onBlur={onBlur}
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-memo bg-white px-3",
          t.error
            ? "border-[1.5px] border-destructive"
            : "border border-line focus-within:border-[1.5px] focus-within:border-primary",
        )}
      >
        <Clock className="size-4 shrink-0 text-ink-400" />
        <input
          ref={hourRef}
          value={t.hour}
          onChange={(e) => t.typeHour(e.target.value)}
          onKeyDown={t.hourKey}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          inputMode="numeric"
          maxLength={2}
          placeholder="--"
          aria-label={`${ariaLabel} 시`}
          disabled={disabled}
          // 시간 칸을 바로 치도록 연 창에서만 쓴다

          autoFocus={autoFocus}
          className={NUMBER}
        />
        <span className="text-[13px] text-ink-400">시</span>
        <span className="text-[15px] font-bold text-ink-350">:</span>
        <input
          ref={minuteRef}
          value={t.minute}
          onChange={(e) => t.typeMinute(e.target.value)}
          onKeyDown={t.minuteKey}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          inputMode="numeric"
          maxLength={2}
          placeholder="--"
          aria-label={`${ariaLabel} 분`}
          disabled={disabled}
          className={NUMBER}
        />
        <span className="flex-1 text-[13px] text-ink-400">분</span>
        {filled && !disabled && (
          <button
            type="button"
            aria-label={`${ariaLabel} 지우기`}
            onClick={t.clear}
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-400"
          >
            <X className="size-3" strokeWidth={2.6} />
          </button>
        )}
      </div>
      {t.error && (
        <span className="text-xs font-semibold text-destructive">
          {timeErrorText(t.error, t.hour)}
        </span>
      )}
    </div>
  );
}
