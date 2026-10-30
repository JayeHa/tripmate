"use client";

import { useState } from "react";

import { useCityAreas, useTripCities } from "@/entities/city";
import { useAlternatives, useGuidePlaces, useScheduleItems } from "@/entities/schedule-item";

import { guideCards, type GuideTab } from "../lib/guide";
import { filterGuideCards, GUIDE_FILTERS_DEFAULT } from "../lib/guide-filter";

/**
 * 가이드 탭의 카드와 필터 — 보관함 · 일정 · 대체 장소 · 여행 도시의 지역을 모아 그 탭의 카드(cards)를 만들고,
 * 필터 · 정렬을 건 카드(shown)를 돌려준다. 보관함을 읽는 동안은 둘 다 null.
 * 필터는 탭마다 처음 값에서 시작한다(탭을 바꾸면 부모가 key 로 새로 그린다)
 */
export function useGuideCards(tripId: string, tab: GuideTab) {
  const { data: rows } = useGuidePlaces(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  // 대체 장소 줄은 일정 조회에 없다 — 대체 장소로만 넣은 장소의 이모지를 찾으려고 함께 넘긴다
  const { data: alternatives = [] } = useAlternatives(tripId);
  const areas = useTripAreas(tripId);
  const [filters, setFilters] = useState(GUIDE_FILTERS_DEFAULT);
  const areaNames = new Map(areas.map((x) => [x.id, x.name]));
  const cards = rows ? guideCards(rows, [...items, ...alternatives], tab, areaNames) : null;
  return {
    cards,
    shown: cards && filterGuideCards(cards, filters),
    areas,
    filters,
    setFilters,
  };
}

/** 여행 도시들의 지역 목록 — 도시 순서, 도시 안에서는 목록 순서. 목록이 없는 도시면 빈 배열 */
function useTripAreas(tripId: string) {
  const { data: cities = [] } = useTripCities(tripId);
  const { data: areas = [] } = useCityAreas();
  return cities.flatMap((c) => areas.filter((a) => a.city_id === c.id));
}
