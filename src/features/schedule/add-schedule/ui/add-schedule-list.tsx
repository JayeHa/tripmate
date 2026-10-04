"use client";

import { Loader2, Plus } from "lucide-react";

import { PLACE_CATEGORIES, type PlaceCategory } from "@/entities/schedule-item";

import { savedKey, savedMeta } from "../lib/chosen";
import type { AddScheduleState } from "../model/use-add-schedule";
import { PlaceRow } from "./place-row";

type AddScheduleListProps = { state: AddScheduleState };

/** 장소 카테고리면 그 값, 아니면 null */
function categoryOf(value: string | null): PlaceCategory | null {
  return PLACE_CATEGORIES.find((c) => c === value) ?? null;
}

/**
 * 목록 칸. 검색어가 있으면 맨 위에 「‘검색어’ 직접 추가」(장소 입력 폼), 그 아래 탭의 목록.
 * - 추천 장소: 구글 검색 결과(고른 도시 근처로 제한). 검색어가 없으면 안내
 * - 저장한 장소: 이 여행 도시의 내 장소
 */
export function AddScheduleList({ state }: AddScheduleListProps) {
  const q = state.query.trim();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {q && (
        <button
          type="button"
          onClick={state.directAdd}
          className="flex w-full items-center gap-3 border-b border-surface-muted px-5 py-3 text-left"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-memo border-[1.5px] border-dashed border-handle text-primary">
            <Plus className="size-5.5" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.75">
            <span className="truncate text-[15px] font-bold text-primary">‘{q}’ 직접 추가</span>
            <span className="text-[13px] text-ink-400">
              위치·운영시간 같은 장소 정보를 직접 입력해요
            </span>
          </span>
        </button>
      )}
      {state.tab === "rec" ? <SuggestionRows state={state} /> : <SavedRows state={state} />}
    </div>
  );
}

/** 추천 장소 탭 — 구글 검색 결과 */
function SuggestionRows({ state }: AddScheduleListProps) {
  const { suggestions: s, query } = state;
  const city = state.cities.find((c) => c.id === state.cityId);
  if (!query.trim()) {
    return (
      <Empty>{city ? `${city.name} 근처 장소를 검색해 보세요` : "장소를 검색해 보세요"}</Empty>
    );
  }
  if (!s.ready) return <Empty>지도 라이브러리를 불러오는 중…</Empty>;
  if (s.error) return <Empty tone="error">{s.error}</Empty>;
  if (s.loading && s.suggestions.length === 0) {
    return (
      <div className="flex justify-center py-12 text-ink-400">
        <Loader2 className="size-5 animate-spin" aria-label="검색 중" />
      </div>
    );
  }
  if (s.suggestions.length === 0) {
    return <Empty>검색 결과가 없어요. 위에서 직접 추가할 수 있어요.</Empty>;
  }
  return s.suggestions.map((sug, i) => {
    const p = sug.placePrediction;
    if (!p) return null;
    return (
      <PlaceRow
        key={p.placeId || i}
        name={p.mainText?.text ?? p.text.text}
        category={null}
        meta={p.secondaryText?.text ?? null}
        inTrip={state.inTrip.googleIds.has(p.placeId)}
        chosen={state.isChosen(`google:${p.placeId}`)}
        busy={state.isResolving(p.placeId)}
        onToggle={() => void state.toggleSuggestion(sug)}
      />
    );
  });
}

/** 저장한 장소 탭 */
function SavedRows({ state }: AddScheduleListProps) {
  if (state.savedLoading) return <Empty>불러오는 중…</Empty>;
  if (state.savedList.length === 0) {
    return (
      <Empty>
        {state.query.trim() || state.category !== "all"
          ? "조건에 맞는 장소가 없어요"
          : "저장한 장소가 없어요. 일정에 담은 장소가 여기 모여요."}
      </Empty>
    );
  }
  return state.savedList.map((place) => (
    <PlaceRow
      key={place.id}
      name={place.name}
      category={categoryOf(place.category)}
      meta={savedMeta(place)}
      rating={place.rating}
      description={place.description}
      inTrip={state.inTrip.placeIds.has(place.id)}
      chosen={state.isChosen(savedKey(place))}
      onToggle={() => state.toggleSaved(place)}
    />
  ));
}

type EmptyProps = { tone?: "error"; children: React.ReactNode };

/** 목록이 비었을 때의 한 줄 */
function Empty({ tone, children }: EmptyProps) {
  return (
    <p
      className={
        tone
          ? "px-5 py-12 text-center text-sm text-destructive"
          : "px-5 py-12 text-center text-sm text-ink-400"
      }
    >
      {children}
    </p>
  );
}
