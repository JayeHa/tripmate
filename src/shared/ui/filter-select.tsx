"use client";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

/** 「전체」(필터를 걸지 않음)의 값 */
export const FILTER_ALL = "all";

export type FilterOption = {
  value: string;
  label: string;
  /** 줄 오른쪽 회색 보조 글(예: 날짜) */
  sub?: string;
};

type FilterSelectProps = {
  /** 아무것도 고르지 않았을 때 칩 글자 · 읽기 프로그램 이름 */
  label: string;
  options: FilterOption[];
  /** 고른 값. 「전체」 면 FILTER_ALL */
  value: string;
  onChange: (value: string) => void;
  /** 맨 위 「전체」 줄의 글. null 이면 줄이 없다(늘 하나를 고르는 선택) */
  allLabel?: string | null;
  /**
   * 칩 폭 — auto: 고른 글자만큼, fit: 가장 긴 옵션 폭으로 고정(골라도 칩 줄이 밀리지 않게). 둘 다 최대 180, 넘치면 말줄임
   */
  width?: "auto" | "fit";
  /** 목록을 칩의 어느 쪽에 맞출지 */
  align?: "start" | "end";
  /** 칩 대신 그릴 버튼(예: 「변경 ⌄」 링크). 받은 요소에 여닫기 동작을 붙인다 */
  trigger?: React.ReactElement;
};

/**
 * 필터 고르기(P33) — 칩을 누르면 아래 6px 에 목록이 뜨고, 고르면 바로 적용하고 닫힌다.
 * 칩 34 · r17 · 13/700 + ⌄ 14, 고르면 잉크 바탕에 고른 글자. 목록 최소 200 · r12 · 줄 40 · 14/600 · 고른 줄 블루 글자 + ✓.
 * 브라우저 기본 select 는 필터에 쓰지 않는다. 지금은 하나 고르기 · 드롭다운만 있다(여러 개 · 모바일 시트는 쓰는 화면이 생길 때)
 */
export function FilterSelect({
  label,
  options,
  value,
  onChange,
  allLabel = "전체",
  width = "auto",
  align = "start",
  trigger,
}: FilterSelectProps) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // 칩에는 겹쳐 그린 옵션 글자가 있어 이름을 직접 준다 — 고른 값이 있으면 함께 읽힌다
        aria-label={current && !trigger ? `${label}: ${current.label}` : label}
        render={trigger ?? <FilterChipButton selected={!!current} />}
      >
        {trigger ? undefined : (
          <ChipText label={label} current={current?.label} options={options} width={width} />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className="w-auto max-w-[calc(100vw-2rem)] min-w-50 border-divider"
      >
        <DropdownMenuRadioGroup value={current ? value : FILTER_ALL} onValueChange={onChange}>
          {allLabel !== null && (
            <>
              <OptionRow value={FILTER_ALL} label={allLabel} />
              <DropdownMenuSeparator className="bg-surface-muted" />
            </>
          )}
          {options.map((o) => (
            <OptionRow key={o.value} {...o} />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type FilterChipButtonProps = React.ComponentProps<"button"> & { selected: boolean };

/** 칩 모양 버튼(P2) — 고르면 잉크 바탕 · 흰 글자, 아니면 #F2F3F5 · #444 */
function FilterChipButton({ selected, className, ...props }: FilterChipButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8.5 max-w-45 shrink-0 items-center gap-1 rounded-full pr-2.5 pl-3 text-[13px] font-bold whitespace-nowrap",
        selected ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-700",
        className,
      )}
      {...props}
    />
  );
}

type ChipTextProps = {
  label: string;
  current: string | undefined;
  options: FilterOption[];
  width: "auto" | "fit";
};

/**
 * 칩 글자 + ⌄. fit 이면 모든 옵션 글자를 같은 칸에 겹쳐 그려(보이는 건 지금 글자 하나) 칸 폭이 가장 긴 글자에 맞춰진다 —
 * 재지 않고 CSS 로만 고정한다
 */
function ChipText({ label, current, options, width }: ChipTextProps) {
  const shown = current ?? label;
  return (
    <>
      <span className="grid min-w-0">
        {width === "fit" &&
          [label, ...options.map((o) => o.label)].map((text) => (
            <span
              key={text}
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 truncate"
            >
              {text}
            </span>
          ))}
        <span className="col-start-1 row-start-1 truncate">{shown}</span>
      </span>
      <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
    </>
  );
}

/** 목록 한 줄 — 글자(고르면 블루) · 오른쪽 회색 보조 글 · 고른 줄 ✓ */
function OptionRow({ value, label, sub }: FilterOption) {
  return (
    <DropdownMenuRadioItem
      value={value}
      // Base UI 라디오 줄은 기본이 「눌러도 닫히지 않음」 — 고르면 바로 적용 · 닫힘
      closeOnClick
      className="h-10 gap-3 rounded-button pr-9 pl-2.5 text-sm font-semibold text-ink-900 focus:bg-surface-muted focus:text-ink-900 **:data-[slot=dropdown-menu-radio-item-indicator]:right-2.5 data-checked:text-brand-text focus:data-checked:text-brand-text [&_[data-slot=dropdown-menu-radio-item-indicator]_svg]:text-brand"
    >
      <span className="flex-1 truncate">{label}</span>
      {sub && <span className="shrink-0 text-xs font-medium text-ink-400">{sub}</span>}
    </DropdownMenuRadioItem>
  );
}
