"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarDays, X } from "lucide-react";

import type { DateSelection } from "@/shared/lib/calendar";
import { dateFieldLabel, nightsLabel, rangeFieldLabel } from "@/shared/lib/date-field";
import { useDatePicker } from "@/shared/lib/use-date-picker";
import { cn } from "@/shared/lib/utils";

import { DatePickerPanel } from "./date-picker-panel";

type CommonProps = {
  /** box = 44 칸(기본) · bare = 테두리 없는 17/700 글자(항공편 폼 행) */
  variant?: "box" | "bare";
  /** 팝오버를 칸 아래(기본) · 위로 */
  placement?: "bottom" | "top";
  /** 팝오버를 칸 왼쪽(기본) · 오른쪽 끝에 맞춘다 */
  align?: "left" | "right";
  /** 비울 수 없다 — ✕ 가 없고 팝오버 왼쪽 버튼이 「취소」 */
  required?: boolean;
  /** 이보다 앞 날짜는 고를 수 없다(yyyy-MM-dd) */
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label": string;
};

type SingleProps = CommonProps & {
  mode?: "single";
  /** yyyy-MM-dd, 비었으면 "" */
  value: string;
  onChange: (value: string) => void;
};

type RangeProps = CommonProps & {
  mode: "range";
  /** 둘 다 yyyy-MM-dd, 비었으면 "" */
  start: string;
  end: string;
  onChange: (value: { start: string; end: string }) => void;
};

export type DateFieldProps = SingleProps | RangeProps;

/** 칸 값을 고르기 상태로 — 비었으면 null */
function selectionOf(props: DateFieldProps): DateSelection {
  if (props.mode === "range")
    return props.start && props.end ? { start: props.start, end: props.end } : null;
  return props.value ? { start: props.value, end: props.value } : null;
}

/** 고른 값(없으면 null)을 칸의 onChange 모양으로 넘긴다 */
function commit(props: DateFieldProps, value: DateSelection) {
  if (props.mode === "range") props.onChange({ start: value?.start ?? "", end: value?.end ?? "" });
  else props.onChange(value?.start ?? "");
}

/**
 * 날짜 칸 — 브라우저 기본 날짜 입력 대신 쓴다. 누르면 아래(또는 위)에 달력 팝오버(316)가 열리고 「확인」 에서 바뀐다.
 * 날짜 하나(single, 「2026.10.28 (수)」)와 기간(range, 「2026.10.31 (토) – 11.04」 + 「4박 5일」)이 있다.
 * 짝인 시작일 · 종료일은 기간 칸 하나로 합친다. 값이 있으면 ✕ 로 비운다(required 면 없다)
 */
export function DateField(props: DateFieldProps) {
  const { variant = "box", placement = "bottom", align = "left", required = false } = props;
  const mode = props.mode ?? "single";
  const value = selectionOf(props);
  const picker = useDatePicker({ mode, value, onCommit: (v) => commit(props, v) });
  const filled = value !== null;

  return (
    <PopoverPrimitive.Root open={picker.open} onOpenChange={picker.onOpenChange}>
      <div
        className={cn(
          "flex items-center gap-2",
          variant === "box" &&
            "h-11 rounded-memo border border-line bg-white px-3 has-data-popup-open:border-[1.5px] has-data-popup-open:border-primary",
          props.disabled && "opacity-40",
        )}
      >
        <PopoverPrimitive.Trigger
          aria-label={props["aria-label"]}
          disabled={props.disabled}
          className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
        >
          {variant === "box" && (
            <CalendarDays
              className={cn("size-4.25 shrink-0", filled ? "text-primary" : "text-ink-400")}
            />
          )}
          <FieldText value={value} mode={mode} variant={variant} placeholder={props.placeholder} />
        </PopoverPrimitive.Trigger>
        {filled && !required && !props.disabled && (
          <button
            type="button"
            aria-label={`${props["aria-label"]} 지우기`}
            onClick={() => commit(props, null)}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-400"
          >
            <X className="size-3" strokeWidth={2.6} />
          </button>
        )}
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side={placement}
          align={align === "left" ? "start" : "end"}
          sideOffset={6}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup className="flex w-79 flex-col gap-2.5 rounded-card border border-divider bg-white p-3.5 shadow-[0_6px_20px_rgba(0,0,0,.12)] outline-none">
            <DatePickerPanel picker={picker} mode={mode} required={required} min={props.min} />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

type FieldTextProps = {
  value: DateSelection;
  mode: "single" | "range";
  variant: "box" | "bare";
  placeholder?: string;
};

/** 칸 안의 글 — 값(기간이면 오른쪽에 박 · 일) 또는 빈 칸 안내 */
function FieldText({ value, mode, variant, placeholder }: FieldTextProps) {
  const size = variant === "bare" ? "text-[17px] font-bold" : "text-[15px] font-bold";
  if (!value) {
    return (
      <span className={cn("flex-1 truncate text-ink-350", size)}>
        {placeholder || (mode === "range" ? "여행 기간 선택" : "날짜 선택")}
      </span>
    );
  }
  if (mode === "single") {
    return (
      <span className={cn("flex-1 truncate text-ink-900", size)}>
        {dateFieldLabel(value.start)}
      </span>
    );
  }
  const end = value.end ?? value.start;
  return (
    <>
      <span className={cn("min-w-0 flex-1 truncate text-ink-900", size)}>
        {rangeFieldLabel(value.start, end)}
      </span>
      <span className="shrink-0 text-[13px] font-semibold text-ink-400">
        {nightsLabel(value.start, end)}
      </span>
    </>
  );
}
