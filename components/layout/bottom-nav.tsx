"use client";

import { CalendarDays, Map, Receipt, Scale, Settings } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { BottomTabBar, type TabItem } from "@/components/layout/bottom-tab-bar";

const TABS = [
  { key: "itinerary", label: "일정", icon: CalendarDays, keepDay: true },
  { key: "map", label: "지도", icon: Map, keepDay: true },
  { key: "expenses", label: "가계부", icon: Receipt },
  { key: "settlement", label: "정산", icon: Scale },
  { key: "settings", label: "설정", icon: Settings },
] as const;

export function BottomNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const day = useSearchParams().get("day");

  const items: TabItem[] = TABS.map((tab) => {
    const base = `/trips/${tripId}/${tab.key}`;
    return {
      key: tab.key,
      label: tab.label,
      icon: tab.icon,
      href: "keepDay" in tab && tab.keepDay && day ? `${base}?day=${day}` : base,
    };
  });
  const active = TABS.find((tab) => pathname.startsWith(`/trips/${tripId}/${tab.key}`))?.key ?? "";

  return <BottomTabBar items={items} active={active} />;
}
