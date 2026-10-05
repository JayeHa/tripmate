"use client";

import { useRef } from "react";

import { hourComplete } from "@/shared/lib/time-draft";
import type { TimePickerState } from "@/shared/lib/use-time-picker";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type TimePickerPanelProps = { picker: TimePickerState };

/**
 * 시간 선택 창의 안쪽 — 미리보기(「16:00」 · 「--:--」) · 시 : 분 숫자 칸 · 「시간 없음 | 확인」.
 * 목록 없이 키보드로만 친다 — 칸에 들어가면 있던 숫자를 전체 선택하고, 시를 다 치면 분 칸으로 넘어가고, Enter 면 확인
 */
export function TimePickerPanel({ picker: p }: TimePickerPanelProps) {
  const minuteRef = useRef<HTMLInputElement>(null);
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
      <div className="flex items-start gap-2">
        <NumberField
          unit="시"
          value={p.hourInput}
          onType={(raw) => {
            p.typeHour(raw);
            if (hourComplete(raw.replace(/\D/g, "").slice(0, 2))) minuteRef.current?.focus();
          }}
          onEnter={p.confirm}
          error={p.hourOutOfRange ? "00–23 사이로 입력해 주세요" : null}
        />
        <span className="pt-8 text-xl font-extrabold text-ink-350">:</span>
        <NumberField
          ref={minuteRef}
          unit="분"
          value={p.minuteInput}
          onType={p.typeMinute}
          onEnter={p.confirm}
          error={p.minuteOutOfRange ? "00–59 사이로 입력해 주세요" : null}
        />
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

type NumberFieldProps = {
  ref?: React.Ref<HTMLInputElement>;
  /** 「시」 · 「분」 — 라벨이자 숫자 뒤 단위 */
  unit: string;
  /** 칸에 보일 숫자(두 자리) */
  value: string;
  onType: (raw: string) => void;
  /** Enter — 확인 */
  onEnter: () => void;
  /** 범위 밖 안내(있으면 빨간 글자) */
  error: string | null;
};

/** 시 · 분 칸 하나(48) — 숫자 두 자리 + 단위. 칸 어디를 눌러도 입력으로, 들어가면 전체 선택 */
function NumberField({ ref, unit, value, onType, onEnter, error }: NumberFieldProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-xs font-bold text-ink-400">{unit}</span>
      <span className="flex h-12 items-center gap-1 rounded-memo border border-line bg-white px-3.5 focus-within:border-[1.5px] focus-within:border-primary">
        <input
          ref={ref}
          value={value}
          onChange={(e) => onType(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          inputMode="numeric"
          maxLength={2}
          placeholder="--"
          aria-label={unit}
          className="w-7 bg-transparent p-0 text-[17px] font-bold text-ink-900 outline-none placeholder:text-ink-350"
        />
        <span className="flex-1 text-[17px] font-bold text-ink-400">{unit}</span>
      </span>
      {error && <span className="text-xs font-semibold text-destructive">{error}</span>}
    </label>
  );
}
