import { X } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

import { HomeTabBar } from "./home-tab-bar";

/** 파란 바탕 위의 뼈대 칸 색 */
const ON_HERO = "bg-white/20";

/**
 * 여행 홈 로딩 뼈대 — 서버 응답(`loading.tsx`)과 여행 · 화면 폭을 아직 모를 때. 파란 히어로 · 탭 줄은 그대로 그리고
 * 여행 이름 · 큰 제목 · 날짜만 칸으로 둔다. 모바일 ✕ 는 누를 수 있다. 서버에서 그려 화면 폭을 모르므로 CSS 로 하나만 보인다
 */
export function HomeSkeleton() {
  return (
    <main className="flex flex-1 flex-col bg-surface-sunken">
      <div className="bg-hero text-white lg:hidden">
        <div className="flex h-13 items-center px-4.5">
          <Link href="/trips" transitionTypes={NAV.back} aria-label="내 여행으로" className="flex">
            <X className="size-6.5" strokeWidth={2} />
          </Link>
        </div>
        <SkeletonScreen className="flex flex-col gap-1.5 px-5 pt-2.5 pb-4.5">
          <Skeleton className={`h-5 w-24 ${ON_HERO}`} />
          <Skeleton className={`h-8.5 w-60 ${ON_HERO}`} />
          <Skeleton className={`mt-2.5 h-9 w-44 rounded-full ${ON_HERO}`} />
        </SkeletonScreen>
        <div className="mx-5 h-px bg-white/28" />
        <HomeTabBar tab="main" variant="mobile" />
      </div>
      <div className="hidden bg-hero text-white lg:block">
        <SkeletonScreen className="mx-auto flex max-w-270 items-end gap-6 px-10 pt-7.5">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className={`h-5 w-28 ${ON_HERO}`} />
            <Skeleton className={`h-10.5 w-80 ${ON_HERO}`} />
          </div>
          <Skeleton className={`mb-1 h-10 w-48 rounded-full ${ON_HERO}`} />
        </SkeletonScreen>
        <HomeTabBar tab="main" variant="pc" />
      </div>
    </main>
  );
}
