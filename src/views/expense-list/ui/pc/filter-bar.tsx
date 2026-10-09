"use client";

import { ArrowUpDown, ChevronDown, Filter } from "lucide-react";

import { FilterMultiSelect } from "@/shared/ui/filter-multi-select";
import { type FilterOption, FilterSelect } from "@/shared/ui/filter-select";

import type { ExpenseFilters, MoreGroups } from "../../lib/filters";
import { type ExpenseSort, SORT_LABEL } from "../../lib/table-groups";
import type { PcList } from "../../model/use-pc-list";
import { MoreFilters, type TogetherOption } from "./more-filters";

type FilterBarProps = {
  pc: PcList;
  categories: FilterOption[];
  payers: FilterOption[];
  methods: FilterOption[];
  more: MoreGroups;
  /** 「필터 더보기」 의 함께한 사람 */
  people: TogetherOption[];
  /** 걸러진 결과 「3건 · ₩120,000」 — 필터가 걸렸을 때만 */
  result: string | null;
  /** 정렬을 바꿨다 */
  onSort: (sort: ExpenseSort) => void;
};

const SORT_OPTIONS = (Object.keys(SORT_LABEL) as ExpenseSort[]).map((value) => ({
  value,
  label: SORT_LABEL[value],
}));

/**
 * PC 필터 줄 — 카테고리 · 결제한 사람 · 결제수단(여럿 고르기, 폭 고정) · 「필터 더보기」, 오른쪽 끝 정렬(34 · r8 테두리 버튼).
 * 하나라도 걸리면 아래 줄 「필터 결과 N건 · 금액 · 초기화」
 */
export function FilterBar({
  pc,
  categories,
  payers,
  methods,
  more,
  people,
  result,
  onSort,
}: FilterBarProps) {
  const { filters, patch } = pc;
  return (
    <div className="flex flex-wrap items-center gap-1.5 gap-y-2">
      <FilterMultiSelect
        label="카테고리"
        options={categories}
        value={filters.categories}
        onChange={(v) => patch({ categories: v as ExpenseFilters["categories"] })}
        width="fit"
      />
      <FilterMultiSelect
        label="결제한 사람"
        options={payers}
        value={filters.payers}
        onChange={(v) => patch({ payers: v })}
        width="fit"
      />
      <FilterMultiSelect
        label="결제수단"
        options={methods}
        value={filters.methods}
        onChange={(v) => patch({ methods: v as ExpenseFilters["methods"] })}
        width="fit"
      />
      <MoreFilters pc={pc} groups={more} people={people} />
      <span className="flex-1" />
      <FilterSelect
        label="정렬"
        options={SORT_OPTIONS}
        value={pc.sort}
        onChange={(v) => onSort(v as ExpenseSort)}
        allLabel={null}
        align="end"
        layout="dropdown"
        trigger={
          <button
            type="button"
            className="flex h-8.5 shrink-0 items-center gap-1.5 rounded-button border border-line pr-2.5 pl-3 text-[13px] font-bold whitespace-nowrap text-ink-700 hover:bg-surface-sunken"
          >
            <ArrowUpDown className="size-3.5 text-ink-500" aria-hidden="true" />
            {SORT_LABEL[pc.sort]}
            <ChevronDown className="size-3.5 text-ink-400" aria-hidden="true" />
          </button>
        }
      />
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
