import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";

import { heroCopy } from "../lib/hero";
import type { HomeTab } from "../lib/home-tabs";
import { HeroDates } from "./hero-dates";
import { HomeTabBar } from "./home-tab-bar";
import { HomeTabBody } from "./home-tab-body";

type PcHomeProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  onTab: (tab: HomeTab) => void;
};

/**
 * PC 여행 홈 — 상단 메뉴 아래 파란 히어로(1080 폭 가운데: 왼쪽 여행 이름 · 큰 제목, 오른쪽 날짜 · 편집) + 홈 탭 줄.
 * 히어로는 통째로 위에 붙고 탭 내용만 스크롤된다. ✕ 는 없다(상단 메뉴의 로고가 내 여행으로 간다)
 */
export function PcHome({ tripId, trip, tab, onTab }: PcHomeProps) {
  const copy = heroCopy(trip.start_date, trip.end_date, todayISO());
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken">
      <div className="sticky top-(--shell-top) z-20 bg-hero text-white">
        <div className="mx-auto flex max-w-270 items-end gap-6 px-10 pt-7.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h1 className="truncate text-base font-bold">{trip.title}</h1>
            <p className="text-[34px] leading-tight font-extrabold tracking-[-0.02em]">
              {copy.headline}
            </p>
          </div>
          <HeroDates
            tripId={tripId}
            startDate={trip.start_date}
            endDate={trip.end_date}
            className="pb-1"
            pillClassName="h-10 px-4.5"
          />
        </div>
        <HomeTabBar tab={tab} onSelect={onTab} variant="pc" />
      </div>
      <HomeTabBody tab={tab} />
    </main>
  );
}
