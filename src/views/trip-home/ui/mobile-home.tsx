"use client";

import { X } from "lucide-react";
import Link from "next/link";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { NAV } from "@/shared/lib/nav-transition";

import { heroCopy } from "../lib/hero";
import type { HomeTab } from "../lib/home-tabs";
import { useHeroCollapse } from "../model/use-hero-collapse";
import { HeroDates } from "./hero-dates";
import { HomeTabBar } from "./home-tab-bar";
import { HomeTabBody } from "./home-tab-body";

type MobileHomeProps = {
  tripId: string;
  trip: Trip;
  tab: HomeTab;
  onTab: (tab: HomeTab) => void;
};

/**
 * 모바일 여행 홈 — 파란 히어로(✕ 줄 · 여행 이름 · 큰 제목 · 날짜) + 홈 탭 줄 + 탭 내용.
 * ✕ 줄과 탭 줄은 위에 붙고, 그 사이의 큰 제목 · 날짜는 스크롤하면 ✕ 줄 아래로 밀려 올라간다.
 * 80px 넘게 내리면 ✕ 옆에 짧은 문구(「여행 D-28」)가 나온다. 둘 다 page 의 직계 자식이어야 sticky 가 끝까지 붙는다
 */
export function MobileHome({ tripId, trip, tab, onTab }: MobileHomeProps) {
  const collapsed = useHeroCollapse();
  const copy = heroCopy(trip.start_date, trip.end_date, todayISO());
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken">
      <div className="sticky top-(--shell-top) z-20 flex h-13 shrink-0 items-center gap-3.5 bg-hero px-4.5 text-white">
        <Link href="/trips" transitionTypes={NAV.back} aria-label="내 여행으로" className="flex">
          <X className="size-6.5" strokeWidth={2} />
        </Link>
        {collapsed && <span className="truncate text-[19px] font-bold">{copy.short}</span>}
      </div>
      <div className="flex flex-col gap-1.5 bg-hero px-5 pt-2.5 pb-4.5 text-white">
        <h1 className="truncate text-[15px] font-bold">{trip.title}</h1>
        <p className="text-[28px] leading-tight font-extrabold tracking-[-0.02em]">
          {copy.headline}
        </p>
        <HeroDates
          tripId={tripId}
          startDate={trip.start_date}
          endDate={trip.end_date}
          className="pt-2.5"
          pillClassName="h-9 px-4"
        />
      </div>
      <div className="sticky top-[calc(var(--shell-top)+3.25rem)] z-20 bg-hero text-white">
        <div className="mx-5 h-px bg-white/28" />
        <HomeTabBar tab={tab} onSelect={onTab} variant="mobile" />
      </div>
      <HomeTabBody tab={tab} />
    </main>
  );
}
