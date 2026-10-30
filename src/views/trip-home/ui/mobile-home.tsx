"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import type { Trip } from "@/entities/trip";
import { InstallNudge } from "@/features/install-nudge";
import { NAV } from "@/shared/lib/nav-transition";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

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
 * 80px 넘게 내리면 ✕ 옆에 여행 이름 · D-day 칩이 나온다. 둘 다 page 의 직계 자식이어야 sticky 가 끝까지 붙는다.
 * 가이드 지도 보기(data-guide-map)면 화면 높이에 맞춰 지도가 남은 칸을 채운다(스크롤 없음).
 * 모바일 브라우저로 열었으면 「홈 화면에 추가」 안내를 띄울 수 있다(InstallNudge)
 */
export function MobileHome({ tripId, trip, tab, onTab }: MobileHomeProps) {
  const collapsed = useHeaderCollapse();
  // 「홈 화면에 추가」 안내의 토스트(설치 끝 · 주소 복사). 탭의 토스트는 탭마다 따로 그려 여기서 쥘 수 없다 — 둘 다 뜰 일은 안내 시트를 쓰는 순간뿐이다
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((text: string) => setToast({ text, id: Date.now() }), []);
  return (
    <main className="flex flex-1 flex-col has-data-guide-map:h-[calc(100dvh-var(--shell-top)-var(--tab-bar))]">
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
      <HomeTitle trip={trip} size="mobile" className="bg-white px-5 pt-0.5 pb-3" />
      <div className="sticky top-[calc(var(--shell-top)+3.25rem)] z-20 bg-white">
        <HomeTabBar tab={tab} onSelect={onTab} variant="mobile" />
      </div>
      <HomeTabBody tripId={tripId} trip={trip} tab={tab} layout="mobile" />
      <InstallNudge onToast={showToast} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
