import { cn } from "@/shared/lib/utils";
import { FILTER_ALL, FilterSelect } from "@/shared/ui/filter-select";
import { FLOAT_SHADOW } from "@/shared/ui/filter-select-parts";

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
  /** 「전 지역 ⌄」 의 옵션(guideAreaOptions). 비면 칩을 숨긴다 */
  areaOptions: { value: string; label: string }[];
  /** 「메뉴 ⌄」 · 「종류 ⌄」 — 칩 이름과 옵션(guideTypeOptions). 옵션이 비면 칩을 숨긴다 */
  types: { name: string; options: { value: string; label: string }[] };
  /** 지도 위에 띄운 줄(GuideMapTopBar 안) — 칩 흰 바탕 + 그림자 */
  floating?: boolean;
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
 * 가이드 필터 줄(P33 FilterSelect) — 지역(목록이 있는 도시만) · 정렬(추천순 · 평점순, 늘 하나) · 메뉴/종류(가를 것이 있을 때) · 일정 포함 여부. 칩 폭은 가장 긴 글자로 고정해 골라도 줄이 밀리지 않는다.
 * 한 줄에 두고 넘치면 가로로 민다(모바일은 화면 끝까지). 필터가 걸리면 끝에 「초기화」(정렬은 그대로)
 */
export function GuideFilterRow({
  filters,
  onChange,
  areaOptions,
  types,
  floating = false,
}: GuideFilterRowProps) {
  return (
    <div
      className={cn(
        "flex scrollbar-none items-center gap-1.5 overflow-x-auto *:shrink-0 [&::-webkit-scrollbar]:hidden",
        // 띄운 줄은 위아래 여백 안에 칩 그림자를 그린다(가로 스크롤 칸이 세로로도 자른다)
        floating ? "py-3 pr-2 pl-4 lg:pl-0" : "-mx-4 px-4 lg:mx-0 lg:px-0",
      )}
    >
      {areaOptions.length > 0 && (
        <FilterSelect
          label="전 지역"
          sheetTitle="지역 선택"
          allLabel="전 지역"
          width="fit"
          floating={floating}
          value={filters.area === "all" ? FILTER_ALL : filters.area}
          onChange={(area) => onChange({ ...filters, area: area === FILTER_ALL ? "all" : area })}
          options={areaOptions}
        />
      )}
      <FilterSelect
        label="추천순"
        sheetTitle="정렬"
        allLabel={null}
        width="fit"
        floating={floating}
        value={filters.sort}
        onChange={(sort) => onChange({ ...filters, sort: sort as GuideSort })}
        options={SORT_OPTIONS}
      />
      {types.options.length > 0 && (
        <FilterSelect
          label={types.name}
          sheetTitle={`${types.name} 선택`}
          allLabel={`${types.name} 전체`}
          width="fit"
          floating={floating}
          value={filters.type === "all" ? FILTER_ALL : filters.type}
          onChange={(type) => onChange({ ...filters, type: type === FILTER_ALL ? "all" : type })}
          options={types.options}
        />
      )}
      <FilterSelect
        label="일정 전체"
        sheetTitle="일정 포함 여부"
        allLabel="일정 전체"
        width="fit"
        floating={floating}
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
          className={cn(
            "text-[13px] font-bold",
            floating
              ? cn("h-8.5 rounded-full bg-white px-3 text-ink-500", FLOAT_SHADOW)
              : "px-1.5 text-ink-400",
          )}
        >
          초기화
        </button>
      )}
    </div>
  );
}
