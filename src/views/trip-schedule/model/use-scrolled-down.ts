"use client";

import { type RefObject, useEffect, useState } from "react";

/** 스크롤하는 곳 — 페이지(모바일) 또는 목록 칸(PC) */
export type ScrollTarget = "window" | RefObject<HTMLElement | null>;

/** 지금 스크롤 위치 */
function topOf(target: ScrollTarget): number {
  return target === "window" ? window.scrollY : (target.current?.scrollTop ?? 0);
}

/**
 * 스크롤하는 곳을 threshold px 보다 내렸는지 — 일정 「맨 위로」 버튼을 내려간 뒤에만 보인다.
 * 칸(ref)은 마운트된 뒤의 요소에 붙는다
 */
export function useScrolledDown(target: ScrollTarget, threshold: number): boolean {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const el: Window | HTMLElement | null = target === "window" ? window : target.current;
    if (!el) return;
    /** 지금 위치로 맞춘다 */
    const onScroll = () => setDown(topOf(target) > threshold);
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [target, threshold]);
  return down;
}

/** 맨 위로 — 부드럽게 */
export function scrollToTop(target: ScrollTarget): void {
  const el = target === "window" ? window : target.current;
  el?.scrollTo({ top: 0, behavior: "smooth" });
}
