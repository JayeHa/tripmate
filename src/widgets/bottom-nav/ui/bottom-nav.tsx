"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { activeTripTab, TRIP_TABS, tripTabHref } from "@/shared/config/trip-tabs";
import { BottomTabBar, type TabItem } from "@/shared/ui/tab-bar";

type BottomNavProps = { tripId: string };

/** 모바일 하단 탭. PC(lg 이상)에서는 PcHeader 의 탭이 대신한다 */
export function BottomNav({ tripId }: BottomNavProps) {
  const pathname = usePathname();
  const day = useSearchParams().get("day");

  const items: TabItem[] = TRIP_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    href: tripTabHref(tripId, tab, day),
  }));

  return <BottomTabBar items={items} active={activeTripTab(pathname, tripId) ?? ""} />;
}
