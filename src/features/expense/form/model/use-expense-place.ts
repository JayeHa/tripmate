import { useState } from "react";

import { useTripCities } from "@/entities/city";
import type { ExpenseCategory, ExpensePlace } from "@/entities/expense";
import { categoryFromGoogle, upsertMyPlace } from "@/entities/schedule-item";
import { saveErrorText } from "@/shared/api/sync";
import { googleMapsUrl, usePlaceSuggestions } from "@/shared/lib/google-places";

import { expenseCategoryOfPlace } from "../lib/link-items";

type Suggestion = google.maps.places.AutocompleteSuggestion;

/** 장소를 고르면 채우는 칸 — 폼이 쥐고, 이 훅은 비어 있을 때만 바꾼다 */
type PlaceFillFields = {
  name: string;
  setName: (name: string) => void;
  category: ExpenseCategory | null;
  setCategory: (category: ExpenseCategory) => void;
};

type ExpensePlaceOptions = {
  tripId: string;
  /** 수정이면 저장된 쓴 곳 */
  initialPlace: ExpensePlace | null;
  fields: PlaceFillFields;
};

/**
 * 비용의 쓴 곳(선택, #289) — 일정에 없는 곳(편의점 · 약국)에서 쓴 돈. 구글에서 찾아 고르면 내 장소로 만들고(일정 · 보관함에는 넣지 않는다)
 * 항목명이 비어 있으면 장소 이름, 카테고리를 아직 안 골랐으면 장소 종류로 채운다. 검색은 여행의 첫 도시 근처로 제한한다.
 * 장소를 고르는 순간 만들어 두므로 비용을 저장하지 않으면 쓰이지 않는 내 장소가 남는다(보이는 곳이 없다)
 */
export function useExpensePlace({ tripId, initialPlace, fields }: ExpensePlaceOptions) {
  const { data: cities = [] } = useTripCities(tripId);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ExpensePlace | null>(initialPlace);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = usePlaceSuggestions(query, cities[0] ?? null);

  /** 검색 결과를 고른다 — 상세를 받아 내 장소로 만든 뒤 붙인다 */
  async function pick(s: Suggestion) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const g = await search.resolve(s);
      if (!g) return;
      const category = categoryFromGoogle(g.types);
      const gmap = g.google_place_id ? googleMapsUrl(g.name, g.google_place_id) : null;
      const id = await upsertMyPlace(tripId, {
        name: g.name,
        google_place_id: g.google_place_id,
        lat: g.lat,
        lng: g.lng,
        address: g.address,
        category,
        gmap_url: gmap,
      });
      setPicked({ id, name: g.name, address: g.address, gmap_url: gmap });
      setQuery("");
      if (!fields.name.trim()) fields.setName(g.name);
      const expenseCategory = expenseCategoryOfPlace(category);
      if (!fields.category && expenseCategory) fields.setCategory(expenseCategory);
    } catch (e) {
      setError(saveErrorText(e, "장소를 고르지 못했어요. 잠시 후 다시 시도해 주세요."));
    } finally {
      setBusy(false);
    }
  }

  return {
    query,
    setQuery,
    suggestions: search.suggestions,
    loading: search.loading,
    /** 검색을 쓸 수 있다(구글 장소 라이브러리를 받았다) */
    ready: search.ready,
    picked,
    pick: (s: Suggestion) => void pick(s),
    /** 고른 장소를 뺀다(✕) */
    clear: () => setPicked(null),
    busy,
    // 구글 검색 오류는 영어 원문이라 우리 문구로
    error: error ?? (search.error ? "장소를 찾지 못했어요. 잠시 후 다시 시도해 주세요." : null),
  };
}

export type ExpensePlaceState = ReturnType<typeof useExpensePlace>;
