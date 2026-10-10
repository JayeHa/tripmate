"use client";

import { useEffect, useState } from "react";

/** 페이지(window)를 threshold px 보다 내렸는지 — 모바일 상단바의 작은 제목을 여행 머리가 지나간 뒤에만 보인다 */
export function useWindowScrolled(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    /** 지금 위치로 맞춘다 */
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
