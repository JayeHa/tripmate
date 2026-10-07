"use client";

import { ChevronDown, Filter } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { CheckMark } from "@/shared/ui/check-mark";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { chipLabel, type ExpenseFilters, STATUS_LABEL } from "../../lib/filters";
import type { PcList } from "../../model/use-pc-list";

/** 여럿 고르는 필터의 고를 거리 — 값 · 이름 */
export type FilterOption = { value: string; label: string };

type FilterBarProps = {
  pc: PcList;
  categories: FilterOption[];
  methods: FilterOption[];
  payers: FilterOption[];
  /** 걸러진 결과 「3건 · ₩120,000」 — 필터가 걸렸을 때만 */
  result: string | null;
};

/**
 * PC 필터 줄(P2 칩 34) — 카테고리 ⌄ · 결제수단 ⌄ · 결제한 사람 ⌄(여럿) · 결제 상태 ⌄(하나) · 합계 제외 숨기기(켜고 끄기).
 * 켜진 칩은 잉크, 고르면 「카테고리 · 식비 외 1」. 하나라도 걸리면 아래 줄 「필터 결과 N건 · 금액 · 초기화」
 */
export function FilterBar({ pc, categories, methods, payers, result }: FilterBarProps) {
  const { filters, patch } = pc;
  return (
    <div className="flex flex-wrap items-center gap-1.5 gap-y-2">
      <MultiChip
        base="카테고리"
        options={categories}
        picked={filters.categories}
        onChange={(v) => patch({ categories: v as ExpenseFilters["categories"] })}
      />
      <MultiChip
        base="결제수단"
        options={methods}
        picked={filters.methods}
        onChange={(v) => patch({ methods: v as ExpenseFilters["methods"] })}
      />
      <MultiChip
        base="결제한 사람"
        options={payers}
        picked={filters.payers}
        onChange={(v) => patch({ payers: v })}
      />
      <StatusChip value={filters.status} onChange={(status) => patch({ status })} />
      <button
        type="button"
        aria-pressed={filters.hideExcluded}
        onClick={() => patch({ hideExcluded: !filters.hideExcluded })}
        className={chipClass(filters.hideExcluded)}
      >
        합계 제외 숨기기
      </button>
      {result && (
        <p className="flex basis-full items-center gap-1.5 text-[13px] text-ink-500">
          <Filter className="size-3.25 text-ink-400" aria-hidden="true" />
          필터 결과 <b className="text-ink-900">{result}</b>
          <button type="button" onClick={pc.reset} className="ml-1 font-bold text-brand-text">
            초기화
          </button>
        </p>
      )}
    </div>
  );
}

/** 칩 모양 — 켜지면 잉크 채움, 꺼지면 흰 바탕 + 회색 테두리 */
function chipClass(on: boolean) {
  return cn(
    "flex h-8.5 shrink-0 items-center gap-1 rounded-full border pr-2.5 pl-3 text-[13px] font-bold whitespace-nowrap",
    on ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-white text-ink-700",
  );
}

type MultiChipProps = {
  base: string;
  options: FilterOption[];
  picked: string[];
  onChange: (picked: string[]) => void;
};

/** 여럿 고르는 칩 — 메뉴(200)에 체크 상자 줄, 아래 「초기화 | 적용」. 고르는 즉시 걸리고, 적용은 닫기만 한다 */
function MultiChip({ base, options, picked, onChange }: MultiChipProps) {
  const [open, setOpen] = useState(false);
  const names = options.filter((o) => picked.includes(o.value)).map((o) => o.label);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className={chipClass(picked.length > 0)}>
        {chipLabel(base, names)}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50">
        {options.map((o) => {
          const on = picked.includes(o.value);
          return (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={on}
              closeOnClick={false}
              onCheckedChange={(checked) =>
                onChange(checked ? [...picked, o.value] : picked.filter((v) => v !== o.value))
              }
              className="h-9.5 gap-2.5 px-2.5 text-sm font-semibold *:data-[slot=dropdown-menu-checkbox-item-indicator]:hidden"
            >
              <CheckMark checked={on} shape="square" className="size-4.5" />
              {o.label}
            </DropdownMenuCheckboxItem>
          );
        })}
        <div className="mt-1 flex justify-between border-t border-surface-muted px-2.5 pt-2 pb-0.5 text-xs font-bold">
          <button type="button" onClick={() => onChange([])} className="text-ink-400">
            초기화
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-brand-text">
            적용
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type StatusChipProps = {
  value: ExpenseFilters["status"];
  onChange: (value: ExpenseFilters["status"]) => void;
};

/** 결제 상태 칩 — 하나만(전체 · 결제 완료만 · 결제 예정만), 고르면 닫힌다 */
function StatusChip({ value, onChange }: StatusChipProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={chipClass(value !== "all")}>
        결제 상태 · {STATUS_LABEL[value]}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as ExpenseFilters["status"])}
        >
          <DropdownMenuRadioItem value="all" className="h-9.5 px-2.5 text-sm font-semibold">
            전체
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="done" className="h-9.5 px-2.5 text-sm font-semibold">
            결제 완료만
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="planned" className="h-9.5 px-2.5 text-sm font-semibold">
            결제 예정만
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
