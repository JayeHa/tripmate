"use client";

import { useLayoutEffect, useRef } from "react";

/** Tailwind lg 경계. 이보다 넓으면 모바일 레이아웃은 숨겨진다. */
const WIDE = "(min-width: 1024px)";

/**
 * 모바일 달력은 지난 달부터 그리므로 이번 달로 스크롤해 둔다.
 * PC 폭에서 날짜 단계에 들어오면 이 달력은 숨겨져(display:none) 스크롤이 먹지 않으니,
 * 창이 좁아져(태블릿 회전) 보이게 되는 순간 다시 맞춘다.
 */
export function useScrollToThisMonth() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroll = () => ref.current?.scrollIntoView({ block: "start" });
    scroll();
    const wide = window.matchMedia(WIDE);
    const onChange = () => !wide.matches && scroll();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);
  return ref;
}
