"use client";

import type { Trip } from "@/entities/trip";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

import { GUIDE_ADD_LABEL, type GuideTab as Tab } from "../../lib/guide";
import {
  guideAreaOptions,
  guideFilteredEmptyText,
  guideTypeName,
  guideTypeOptions,
  hasGuideFilter,
} from "../../lib/guide-filter";
import { useGuideActions } from "../../model/use-guide-actions";
import { useGuideCards } from "../../model/use-guide-cards";
import { useGuideView } from "../../model/use-guide-view";
import { GuideFilterRow } from "./guide-filter-row";
import { GuideInfoRow } from "./guide-info-row";
import { GuideList } from "./guide-list";
import { GuideOverlays } from "./guide-overlays";
import { GuideMapTopBar } from "./map/guide-map-top-bar";
import { GuideMapView } from "./map/guide-map-view";

type GuideTabProps = { trip: Trip; tab: Tab; layout: "mobile" | "pc" };

const EMPTY_TEXT = "아직 장소가 없어요. 가고 싶은 곳을 모아 두면 일정에 바로 넣을 수 있어요.";

/**
 * 가이드 탭(관광지 · 식당 · 쇼핑 · 휴식) — 이 여행 보관함의 장소. 맨 위 안내 줄 오른쪽 「목록 | 지도」(기기마다 기억),
 * 그 아래 필터 줄(지역 · 정렬 · 메뉴/종류 · 일정 포함 여부).
 * 목록은 카드(모바일 한 줄, PC 3열 · 가운데 1080) — 누르면 상세, ⋯ 는 수정 · 메모 · 빼기, 「+ 일정」 은 날짜 고르기, 맨 아래 「+ ○○ 추가」.
 * 지도면 홈 탭 줄 아래를 지도가 채우고 안내 줄은 뺀다. 필터 칩 · 「목록」 은 지도 위에 띄운다(GuideMapView)
 */
export function GuideTab({ trip, tab, layout }: GuideTabProps) {
  const { cards, shown, areas, filters, setFilters } = useGuideCards(trip.id, tab);
  const a = useGuideActions(trip.id, tab);
  const { view, setView } = useGuideView();
  const isMap = view === "map";
  const filterRow = (
    <GuideFilterRow
      filters={filters}
      onChange={setFilters}
      areaOptions={guideAreaOptions(cards ?? [], areas)}
      types={{ name: guideTypeName(tab), options: guideTypeOptions(cards ?? [], tab) }}
      floating={isMap}
    />
  );

  return (
    <div className={cn("flex flex-1 flex-col bg-surface-sunken", isMap && "min-h-0")}>
      {isMap ? (
        <GuideMapView
          cards={shown ?? []}
          layout={layout}
          a={a}
          top={<GuideMapTopBar onList={() => setView("list")}>{filterRow}</GuideMapTopBar>}
        />
      ) : (
        <div className="flex w-full flex-col gap-4.5 px-4 pt-4.5 pb-7 lg:mx-auto lg:max-w-270 lg:px-10 lg:pt-7 lg:pb-10">
          <GuideInfoRow view={view} onView={setView} />
          {filterRow}
          {shown === null && <GuideSkeleton />}
          {shown && (
            <GuideList
              key={`${filters.sort}-${filters.status}-${filters.area}-${filters.type}`}
              cards={shown}
              emptyText={
                hasGuideFilter(filters) ? guideFilteredEmptyText(filters.status) : EMPTY_TEXT
              }
              addLabel={GUIDE_ADD_LABEL[tab]}
              a={a}
            />
          )}
        </div>
      )}
      <GuideOverlays trip={trip} cards={cards ?? []} tab={tab} a={a} />
    </div>
  );
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
