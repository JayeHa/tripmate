"use client";

import { X } from "lucide-react";
import Link from "next/link";

import type { Trip } from "@/entities/trip";
import { NAV } from "@/shared/lib/nav-transition";

import type { HomeTab } from "../lib/home-tabs";
import { useHeaderCollapse } from "../model/use-header-collapse";
import { HomeTabBar } from "./home-tab-bar";
import { HomeTabBody } from "./home-tab-body";
import { DdayChip, HomeTitle } from "./home-title";

type MobileHomeProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  onTab: (tab: HomeTab) => void;
};

/**
 * 모바일 여행 홈 — 흰 머리(✕ 줄 · 여행 이름 줄) + 홈 탭 줄 + 탭 내용.
 * ✕ 줄과 탭 줄은 위에 붙고, 그 사이의 여행 이름 줄은 스크롤하면 ✕ 줄 아래로 밀려 올라간다.
 * 80px 넘게 내리면 ✕ 옆에 여행 이름 · D-day 칩이 나온다. 둘 다 page 의 직계 자식이어야 sticky 가 끝까지 붙는다
 */
export function MobileHome({ tripId, trip, tab, onTab }: MobileHomeProps) {
  const collapsed = useHeaderCollapse();
  return (
    <main className="flex flex-1 flex-col">
      <div className="sticky top-(--shell-top) z-20 flex h-13 shrink-0 items-center gap-3.5 bg-white px-4.5 text-ink-900">
        <Link href="/trips" transitionTypes={NAV.back} aria-label="내 여행으로" className="flex">
          <X className="size-6.5" strokeWidth={2} />
        </Link>
        {collapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[17px] font-extrabold">{trip.title}</span>
            <DdayChip trip={trip} size="mobile" />
          </div>
        )}
      </div>
      <HomeTitle tripId={tripId} trip={trip} size="mobile" className="bg-white px-5 pt-0.5 pb-3" />
      <div className="sticky top-[calc(var(--shell-top)+3.25rem)] z-20 bg-white">
        <HomeTabBar tab={tab} onSelect={onTab} variant="mobile" />
      </div>
      <HomeTabBody tripId={tripId} trip={trip} tab={tab} layout="mobile" />
    </main>
  );
}
