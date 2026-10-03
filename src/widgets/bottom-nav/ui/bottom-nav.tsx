"use client";

import { CalendarDays, House, NotebookPen, Receipt, Settings } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { BottomTabBar, type TabItem } from "@/shared/ui/tab-bar";

/**
 * 여행 안 5개 탭. 지도는 일정 하위, 정산은 가계부 하위라 탭에 없다.
 * (design_handoff_tripmate/README.md · 앱 흐름)
 */
const TABS = [
  { key: "home", label: "홈", icon: House },
  { key: "schedule", label: "일정", icon: CalendarDays, keepDay: true },
  { key: "expenses", label: "가계부", icon: Receipt },
  { key: "notes", label: "노트", icon: NotebookPen },
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
  // 하위 라우트(일정>지도, 가계부>정산)에서도 부모 탭이 활성이다.
  const active = TABS.find((tab) => pathname.startsWith(`/trips/${tripId}/${tab.key}`))?.key ?? "";

  return <BottomTabBar items={items} active={active} />;
}
