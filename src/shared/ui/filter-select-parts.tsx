import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type * as React from "react";

import { DropdownMenuRadioItem } from "@/shared/ui/dropdown-menu";

export type FilterOption = {
  value: string;
  label: string;
  /** 회색 보조 글(예: 날짜) — 드롭다운은 줄 오른쪽, 시트는 이름 아래 */
  sub?: string;
  /** 줄 왼쪽에 그릴 것(예: 아바타) */
  icon?: React.ReactNode;
};

type FilterChipButtonProps = React.ComponentProps<"button"> & { selected: boolean };

/** 칩 모양 버튼(P2) — 고르면 잉크 바탕 · 흰 글자, 아니면 #F2F3F5 · #444 */
export function FilterChipButton({ selected, className, ...props }: FilterChipButtonProps) {
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
export function ChipText({ label, current, options, width }: ChipTextProps) {
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

/**
 * 목록 한 줄 — 글자(고르면 블루) · 오른쪽 회색 보조 글 · 고른 줄 ✓.
 * 기본 RadioItem 의 `focus:**:text-accent-foreground` 는 자식에 색을 직접 걸어 고른 줄의 블루를 덮는다 — 자식이 줄 색을 따르게 바꾼다
 */
export function OptionRow({ value, label, sub, icon }: FilterOption) {
  return (
    <DropdownMenuRadioItem
      value={value}
      // Base UI 라디오 줄은 기본이 「눌러도 닫히지 않음」 — 고르면 바로 적용 · 닫힘
      closeOnClick
      className="h-10 gap-3 rounded-button pr-9 pl-2.5 text-sm font-semibold text-ink-900 focus:bg-surface-muted focus:text-ink-900 focus:**:text-inherit **:data-[slot=dropdown-menu-radio-item-indicator]:right-2.5 data-checked:text-brand-text focus:data-checked:text-brand-text [&_[data-slot=dropdown-menu-radio-item-indicator]_svg]:text-brand"
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {/* 회색을 지킨다 — 포커스 때 자식 글자 색을 줄 색으로 맞추는 규칙(focus:**:text-inherit)보다 앞서게 */}
      {sub && <span className="shrink-0 text-xs font-medium text-ink-400!">{sub}</span>}
    </DropdownMenuRadioItem>
  );
}
