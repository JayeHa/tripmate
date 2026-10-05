"use client";

import { Clock, X } from "lucide-react";

import { useTimePicker } from "@/shared/lib/use-time-picker";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { TimePickerPanel } from "./time-picker-panel";

type TimeFieldProps = {
  /** 「HH:mm」 또는 ""(시간 없음) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 분 목록 간격 */
  step?: number;
  /** 창을 칸 아래(기본) · 위에 연다 — 아래 공간이 모자란 자리 */
  placement?: "bottom" | "top";
  "aria-label"?: string;
};

/**
 * 시간 칸 — 브라우저 기본 시간 입력 대신 쓴다. 누르면 칸 아래(또는 위) 300 창에서 시 · 분을 고르고 「확인」 해야 바뀐다.
 * 값이 있으면 오른쪽 ✕ 로 지운다. 결제 예정일 달력과 같은 팝오버 계열
 */
export function TimeField({
  value,
  onChange,
  placeholder = "시간 선택",
  step = 5,
  placement = "bottom",
  "aria-label": ariaLabel = "시간",
}: TimeFieldProps) {
  const picker = useTimePicker(value, onChange);
  return (
    <Popover open={picker.open} onOpenChange={picker.setOpen}>
      <div className="relative">
        <PopoverTrigger
          aria-label={value ? `${ariaLabel} ${value}` : ariaLabel}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-memo bg-white pr-10 pl-3.5 text-left",
            picker.open ? "border-[1.5px] border-primary" : "border border-line",
          )}
        >
          <Clock className={cn("size-4.25 shrink-0", value ? "text-primary" : "text-ink-350")} />
          <span
            className={cn(
              "text-[15px]",
              value ? "font-bold text-ink-900" : "font-medium text-ink-350",
            )}
          >
            {value || placeholder}
          </span>
        </PopoverTrigger>
        {value && !picker.open && (
          <button
            type="button"
            aria-label={`${ariaLabel} 지우기`}
            onClick={() => onChange("")}
            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-line"
          >
            <X className="size-3 text-white" strokeWidth={3} />
          </button>
        )}
      </div>
      <PopoverContent
        side={placement}
        align="start"
        sideOffset={6}
        className="w-75 max-w-[calc(100vw-2rem)] gap-0 rounded-card bg-white p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] ring-1 ring-divider"
      >
        <TimePickerPanel picker={picker} step={step} />
      </PopoverContent>
    </Popover>
  );
}
