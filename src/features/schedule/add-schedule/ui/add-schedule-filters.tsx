"use client";

import { Search, X } from "lucide-react";

import { CATEGORY_LABEL, PLACE_CATEGORIES } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { AddScheduleState } from "../model/use-add-schedule";

/** 일정 추가에서 고르는 카테고리. 공항 · 교통은 담을 장소가 아니라 뺀다 */
const CATEGORIES = PLACE_CATEGORIES.filter((c) => c !== "air");

type AddScheduleFiltersProps = { state: AddScheduleState };

/**
 * 검색창(46, 회색 바탕) · 도시 칩(여러 도시 여행만) · 탭 「추천 장소 / 저장한 장소 N」 · 카테고리 칩(저장한 장소만).
 * 추천 장소는 구글 결과라 카테고리를 모른다 — 그래서 카테고리 칩은 저장한 장소 탭에서만 보인다.
 */
export function AddScheduleFilters({ state }: AddScheduleFiltersProps) {
  return (
    <>
      <div className="shrink-0 px-5 pt-1.5">
        <label className="flex h-11.5 items-center gap-2 rounded-card bg-surface-muted px-3.5">
          <Search className="size-5 shrink-0 text-ink-400" />
          <input
            value={state.query}
            onChange={(e) => state.setQuery(e.target.value)}
            maxLength={100}
            enterKeyHint="search"
            placeholder="장소·맛집·카페 검색"
            aria-label="장소 검색"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none"
          />
          {state.query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => state.setQuery("")}
              className="flex size-5 items-center justify-center rounded-full bg-handle text-white"
            >
              <X className="size-3" strokeWidth={3} />
            </button>
          )}
        </label>
      </div>
      {state.cities.length > 1 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-5 pt-2.5" aria-label="검색할 도시">
          {state.cities.map((c) => (
            <Chip key={c.id} on={c.id === state.cityId} onClick={() => state.setCityId(c.id)}>
              {c.name}
            </Chip>
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
          <Chip on={state.category === "all"} onClick={() => state.setCategory("all")}>
            전체
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} on={state.category === c} onClick={() => state.setCategory(c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
      )}
    </>
  );
}

type ChipProps = { on: boolean; onClick: () => void; children: React.ReactNode };

/** 32 알약 칩. 고르면 잉크 바탕 */
function Chip({ on, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center rounded-full px-3.25 text-[13px] font-bold",
        on ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-600",
      )}
    >
      {children}
    </button>
  );
}
