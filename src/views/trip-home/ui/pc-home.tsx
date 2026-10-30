import type { Trip } from "@/entities/trip";

import type { HomeTab } from "../lib/home-tabs";
import { HomeTabBar } from "./home-tab-bar";
import { HomeTabBody } from "./home-tab-body";
import { HomeTitle } from "./home-title";

type PcHomeProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  onTab: (tab: HomeTab) => void;
};

/**
 * PC 여행 홈 — 상단 메뉴 아래 흰 머리(1080 폭 가운데: 여행 이름 · D-day 칩 · 기간 · 편집) + 홈 탭 줄, 회색 바탕의 탭 내용.
 * 머리는 통째로 위에 붙고 탭 내용만 스크롤된다. ✕ 는 없다(상단 메뉴의 로고가 내 여행으로 간다).
 * 가이드 지도 보기(data-guide-map)면 화면 높이에 맞춰 지도가 남은 칸을 채운다
 */
export function PcHome({ tripId, trip, tab, onTab }: PcHomeProps) {
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken has-data-guide-map:h-[calc(100dvh-var(--shell-top)-var(--tab-bar))]">
      <div className="sticky top-(--shell-top) z-20 border-b border-divider bg-white">
        <HomeTitle trip={trip} size="pc" className="mx-auto w-full max-w-270 px-10 pt-6.5" />
        <HomeTabBar tab={tab} onSelect={onTab} variant="pc" />
      </div>
      <HomeTabBody tripId={tripId} trip={trip} tab={tab} layout="pc" />
    </main>
  );
}
