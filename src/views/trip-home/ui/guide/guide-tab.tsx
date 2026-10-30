"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

import { useCityAreas, useTripCities } from "@/entities/city";
import { useAlternatives, useGuidePlaces, useScheduleItems } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { Skeleton } from "@/shared/ui/skeleton";

import { GUIDE_ADD_LABEL, guideCards, type GuideTab as Tab } from "../../lib/guide";
import {
  filterGuideCards,
  GUIDE_FILTERS_DEFAULT,
  guideAreaOptions,
  guideFilteredEmptyText,
  hasGuideFilter,
} from "../../lib/guide-filter";
import { useGuideActions } from "../../model/use-guide-actions";
import { GuideFilterRow } from "./guide-filter-row";
import { GuideList } from "./guide-list";
import { GuideOverlays } from "./guide-overlays";

type GuideTabProps = { trip: Trip; tab: Tab };

const EMPTY_TEXT = "아직 장소가 없어요. 가고 싶은 곳을 모아 두면 일정에 바로 넣을 수 있어요.";

/**
 * 가이드 탭(관광지 · 식당 · 쇼핑 · 휴식) — 이 여행 보관함의 장소를 카드로. 모바일 한 줄, PC 3열(가운데 1080).
 * 위 필터 줄(지역 · 정렬 · 일정 포함 여부)은 탭마다 처음 값에서 시작한다(탭을 바꾸면 부모가 key 로 새로 그린다).
 * 카드를 누르면 상세, ⋯ 는 수정 · 메모 · 빼기, 「+ 일정」 은 날짜 고르기, 맨 아래 「+ ○○ 추가」 는 장소 입력
 */
export function GuideTab({ trip, tab }: GuideTabProps) {
  const tripId = trip.id;
  const { data: rows } = useGuidePlaces(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  // 대체 장소 줄은 일정 조회에 없다 — 대체 장소로만 넣은 장소의 이모지를 찾으려고 함께 넘긴다
  const { data: alternatives = [] } = useAlternatives(tripId);
  const areas = useTripAreas(tripId);
  const [filters, setFilters] = useState(GUIDE_FILTERS_DEFAULT);
  const areaNames = new Map(areas.map((x) => [x.id, x.name]));
  const cards = rows ? guideCards(rows, [...items, ...alternatives], tab, areaNames) : null;
  const shown = cards && filterGuideCards(cards, filters);
  const a = useGuideActions(tripId, tab);

  return (
    <div className="flex flex-1 flex-col bg-surface-sunken">
      <div className="flex w-full flex-col gap-4.5 px-4 pt-4.5 pb-7 lg:mx-auto lg:max-w-270 lg:px-10 lg:pt-7 lg:pb-10">
        <p className="flex items-center gap-1.5 text-xs text-ink-400">
          <MapPin className="size-3.25" aria-hidden="true" />
          <span>
            <b className="font-bold text-ink-700">이 여행의 장소</b> · 일행과 함께 모아요. 일정에
            넣은 장소도 여기 남아요
          </span>
        </p>
        <GuideFilterRow
          filters={filters}
          onChange={setFilters}
          areaOptions={guideAreaOptions(cards ?? [], areas)}
        />
        {shown === null && <GuideSkeleton />}
        {shown && (
          <GuideList
            key={`${filters.sort}-${filters.status}-${filters.area}`}
            cards={shown}
            emptyText={
              hasGuideFilter(filters) ? guideFilteredEmptyText(filters.status) : EMPTY_TEXT
            }
            addLabel={GUIDE_ADD_LABEL[tab]}
            a={a}
          />
        )}
      </div>
      <GuideOverlays trip={trip} cards={cards ?? []} tab={tab} a={a} />
    </div>
  );
}

/** 여행 도시들의 지역 목록 — 도시 순서, 도시 안에서는 목록 순서. 목록이 없는 도시면 빈 배열 */
function useTripAreas(tripId: string) {
  const { data: cities = [] } = useTripCities(tripId);
  const { data: areas = [] } = useCityAreas();
  return cities.flatMap((c) => areas.filter((a) => a.city_id === c.id));
}

/** 보관함을 읽는 동안 — 카드 세 장 자리 */
function GuideSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
    </div>
  );
}
