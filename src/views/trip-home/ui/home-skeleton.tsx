import { X } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

import { HomeTabBar } from "./home-tab-bar";

/**
 * 여행 홈 로딩 뼈대 — 서버 응답(`loading.tsx`)과 여행 · 화면 폭을 아직 모를 때. 흰 머리 · 탭 줄은 그대로 그리고
 * 여행 이름 · D-day 칩 · 기간만 칸으로 둔다. 모바일 ✕ 는 누를 수 있다. 서버에서 그려 화면 폭을 모르므로 CSS 로 하나만 보인다
 */
export function HomeSkeleton() {
  return (
    <main className="flex flex-1 flex-col lg:bg-surface-sunken">
      <div className="bg-white text-ink-900 lg:hidden">
        <div className="flex h-13 items-center px-4.5">
          <Link href="/trips" transitionTypes={NAV.back} aria-label="내 여행으로" className="flex">
            <X className="size-6.5" strokeWidth={2} />
          </Link>
        </div>
        <SkeletonScreen className="flex flex-col gap-1.5 px-5 pt-0.5 pb-3">
          <Skeleton className="h-7.5 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </SkeletonScreen>
        <HomeTabBar tab="summary" variant="mobile" />
      </div>
      <div className="hidden border-b border-divider bg-white lg:block">
        <SkeletonScreen className="mx-auto flex max-w-270 flex-col gap-2 px-10 pt-6.5">
          <Skeleton className="h-9.5 w-52" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6.5 w-14 rounded-full" />
            <Skeleton className="h-4.5 w-44" />
          </div>
        </SkeletonScreen>
        <HomeTabBar tab="summary" variant="pc" />
      </div>
    </main>
  );
}
