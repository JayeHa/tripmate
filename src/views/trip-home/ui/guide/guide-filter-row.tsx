import { FILTER_ALL, FilterSelect } from "@/shared/ui/filter-select";

import {
  GUIDE_FILTERS_DEFAULT,
  type GuideFilters,
  type GuideSort,
  type GuideStatus,
  hasGuideFilter,
} from "../../lib/guide-filter";

type GuideFilterRowProps = {
  filters: GuideFilters;
  onChange: (filters: GuideFilters) => void;
};

const SORT_OPTIONS = [
  { value: "rec", label: "추천순" },
  { value: "rating", label: "평점순" },
];

const STATUS_OPTIONS = [
  { value: "in", label: "일정에 있음" },
  { value: "out", label: "아직 안 넣음" },
];

/**
 * 가이드 필터 줄(P33 FilterSelect) — 정렬(추천순 · 평점순, 늘 하나) · 일정 포함 여부. 칩 폭은 가장 긴 글자로 고정해 골라도 줄이 밀리지 않는다.
 * 필터가 걸리면 끝에 「초기화」(정렬은 그대로)
 */
export function GuideFilterRow({ filters, onChange }: GuideFilterRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterSelect
        label="추천순"
        sheetTitle="정렬"
        allLabel={null}
        width="fit"
        value={filters.sort}
        onChange={(sort) => onChange({ ...filters, sort: sort as GuideSort })}
        options={SORT_OPTIONS}
      />
      <FilterSelect
        label="일정 전체"
        sheetTitle="일정 포함 여부"
        allLabel="일정 전체"
        width="fit"
        value={filters.status === "all" ? FILTER_ALL : filters.status}
        onChange={(status) =>
          onChange({ ...filters, status: status === FILTER_ALL ? "all" : (status as GuideStatus) })
        }
        options={STATUS_OPTIONS}
      />
      {hasGuideFilter(filters) && (
        <button
          type="button"
          onClick={() => onChange({ ...GUIDE_FILTERS_DEFAULT, sort: filters.sort })}
          className="px-1.5 text-[13px] font-bold text-ink-400"
        >
          초기화
        </button>
      )}
    </div>
  );
}
