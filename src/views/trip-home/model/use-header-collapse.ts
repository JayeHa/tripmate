"use client";

import { useEffect, useState } from "react";

import { nextCollapsed } from "../lib/home-header";

/**
 * 모바일 홈 머리가 접혔는지 — 페이지 스크롤 위치로 정한다(80 을 넘으면 접고 24 이하에서 편다).
 * 접혀도 머리 높이는 바뀌지 않는다(여행 이름 줄은 스크롤로 밀려 올라갈 뿐) — 높이가 바뀌면 스크롤 위치가 따라 움직여 접힘이 되풀이된다
 */
export function useHeaderCollapse(): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const onScroll = () => setCollapsed((c) => nextCollapsed(c, window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return collapsed;
}
