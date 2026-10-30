"use client";

import type { City } from "../model/types";
import { useCityCatalog } from "../model/use-city-catalog";
import { CityPicker } from "./city-picker";

type CityCatalogPickerProps = {
  query: string;
  /** 고른 도시 id(고른 순서) */
  selected: string[];
  onToggle: (city: City) => void;
  layout: "mobile" | "pc";
};

/** 도시 목록을 받아 와 고르게 한다(새 여행 · 도시 편집). 받는 동안 · 실패했을 때의 자리를 함께 맡는다 */
export function CityCatalogPicker({ query, selected, onToggle, layout }: CityCatalogPickerProps) {
  const { data: catalog, error } = useCityCatalog();
  if (!catalog) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-ink-400">
        {error ? "도시 목록을 불러오지 못했어요" : "도시를 불러오는 중…"}
      </p>
    );
  }
  return (
    <CityPicker
      catalog={catalog}
      query={query}
      selected={selected}
      onToggle={onToggle}
      layout={layout}
    />
  );
}
