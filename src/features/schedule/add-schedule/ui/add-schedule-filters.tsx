"use client";

import { CATEGORY_LABEL, PLACE_CATEGORIES } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { FilterChip } from "@/shared/ui/filter-chip";
import { SearchField } from "@/shared/ui/search-field";

import type { AddScheduleState } from "../model/use-add-schedule";

/** 일정 추가에서 고르는 카테고리. 공항 · 교통은 담을 장소가 아니라 뺀다 */
const CATEGORIES = PLACE_CATEGORIES.filter((c) => c !== "air");

type AddScheduleFiltersProps = { state: AddScheduleState };

/**
 * 검색창(P3) · 도시 칩(여러 도시 여행만) · 탭 「추천 장소 / 저장한 장소 N」 · 카테고리 칩(저장한 장소만).
 * 추천 장소는 구글 결과라 카테고리를 모른다 — 그래서 카테고리 칩은 저장한 장소 탭에서만 보인다.
 */
export function AddScheduleFilters({ state }: AddScheduleFiltersProps) {
  return (
    <>
      <div className="shrink-0 px-5 pt-1.5">
        <SearchField
          value={state.query}
          onValueChange={state.setQuery}
          maxLength={100}
          enterKeyHint="search"
          placeholder="장소·맛집·카페 검색"
          aria-label="장소 검색"
        />
      </div>
      {state.cities.length > 1 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-5 pt-2.5" aria-label="검색할 도시">
          {state.cities.map((c) => (
            <FilterChip
              key={c.id}
              selected={c.id === state.cityId}
              onClick={() => state.setCityId(c.id)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>
      )}
      <div
        className="flex shrink-0 gap-5.5 border-b border-surface-muted px-5 pt-3.5"
        role="tablist"
      >
        {(
          [
            ["rec", "추천 장소"],
            ["saved", `저장한 장소 ${state.savedCount}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={state.tab === key}
            onClick={() => state.setTab(key)}
            className={cn(
              "-mb-px border-b-2 pt-1 pb-2.5 text-[15px] font-bold",
              state.tab === key ? "border-ink-900 text-ink-900" : "border-transparent text-ink-350",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {state.tab === "saved" && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-5 py-3">
          <FilterChip selected={state.category === "all"} onClick={() => state.setCategory("all")}>
            전체
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              selected={state.category === c}
              onClick={() => state.setCategory(c)}
            >
              {CATEGORY_LABEL[c]}
            </FilterChip>
          ))}
        </div>
      )}
    </>
  );
}
