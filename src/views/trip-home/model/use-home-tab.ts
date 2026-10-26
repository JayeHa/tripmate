"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type HomeTab, parseHomeTab } from "../lib/home-tabs";

/**
 * 지금 홈 탭(주소의 tab). 탭을 바꾸면 주소를 바꾸되 방문 기록은 쌓지 않고, 화면을 맨 위로 올린다 —
 * 탭마다 내용 길이가 달라 보던 자리가 다른 탭에서는 뜻이 없고, 모바일 히어로도 펼친 상태로 돌아온다
 */
export function useHomeTab() {
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseHomeTab(useSearchParams().get("tab"));
  return {
    tab,
    setTab: (next: HomeTab) => {
      if (next === tab) return;
      router.replace(next === "main" ? pathname : `${pathname}?tab=${next}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "instant" });
    },
  };
}
