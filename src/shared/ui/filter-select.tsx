"use client";

import type * as React from "react";

import { useMediaQuery } from "@/shared/lib/use-media-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ChipText, FilterChipButton, type FilterOption, OptionRow } from "./filter-select-parts";
import { SheetSelect } from "./filter-select-sheet";

/** 「전체」(필터를 걸지 않음)의 값 */
export const FILTER_ALL = "all";

export type { FilterOption } from "./filter-select-parts";

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
  /** 칩 대신 그릴 버튼(예: 「변경 ⌄」 링크 · 사람 이름 머리). 받은 요소에 여닫기 동작을 붙인다 */
  trigger?: React.ReactElement<{ onClick?: () => void; "aria-haspopup"?: "dialog" }>;
  /**
   * auto: PC(1024 이상)는 드롭다운, 그 아래는 바텀시트. dropdown: 늘 드롭다운 —
   * 시트 · 창 안에서 여는 필터(시트 위에 시트가 뜨지 않게)와 날짜 메모 「변경」 이 쓴다
   */
  layout?: "auto" | "dropdown";
  /** 시트 제목. 없으면 label */
  sheetTitle?: string;
};

/**
 * 필터 고르기(P33) — 칩을 누르면 아래 6px 에 목록이 뜨고, 고르면 바로 적용하고 닫힌다.
 * 칩 34 · r17 · 13/700 + ⌄ 14, 고르면 잉크 바탕에 고른 글자. 목록 최소 200 · r12 · 줄 40 · 14/600 · 고른 줄 블루 글자 + ✓.
 * 1024 아래는 바텀시트에서 고른다(layout="auto"). 브라우저 기본 select 는 필터에 쓰지 않는다.
 * 여러 개 고르기는 FilterMultiSelect
 */
export function FilterSelect(props: FilterSelectProps) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  // 화면 폭을 모르는 첫 렌더(서버 · 하이드레이션)는 드롭다운으로 그린다
  if ((props.layout ?? "auto") === "auto" && desktop === false) return <SheetFilter {...props} />;
  return <DropdownFilter {...props} />;
}

/** 칩 글 — 고른 것(없으면 label), fit 이면 겹쳐 그릴 모든 글 */
function chipTexts(
  label: string,
  current: FilterOption | undefined,
  options: FilterOption[],
  width: "auto" | "fit",
) {
  return {
    shown: { key: "shown", text: current?.label ?? label, icon: current?.chipIcon },
    widest:
      width === "fit"
        ? [
            { key: FILTER_ALL, text: label },
            ...options.map((o) => ({ key: o.value, text: o.label, icon: o.chipIcon })),
          ]
        : [],
  };
}

/** 1024 아래 — 칩(또는 받은 버튼)을 누르면 바텀시트 */
function SheetFilter({
  label,
  options,
  value,
  onChange,
  allLabel = "전체",
  width = "auto",
  trigger,
  sheetTitle,
}: FilterSelectProps) {
  const current = options.find((o) => o.value === value);
  const chip = (
    <FilterChipButton
      selected={!!current}
      aria-label={current ? `${label}: ${current.label}` : label}
      aria-haspopup="dialog"
    >
      <ChipText {...chipTexts(label, current, options, width)} />
    </FilterChipButton>
  );
  return (
    <SheetSelect
      trigger={trigger ?? chip}
      title={sheetTitle ?? label}
      options={options}
      value={current ? value : FILTER_ALL}
      allValue={FILTER_ALL}
      allLabel={allLabel}
      onChange={onChange}
    />
  );
}

/** PC — 칩(또는 받은 버튼) 아래 6px 에 드롭다운 */
function DropdownFilter({
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
        {trigger ? undefined : <ChipText {...chipTexts(label, current, options, width)} />}
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
