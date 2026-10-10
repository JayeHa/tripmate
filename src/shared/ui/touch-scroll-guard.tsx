"use client";

import { useTouchScrollGuard } from "@/shared/lib/use-touch-scroll-guard";

/**
 * 창 Popup 의 자식으로 넣는다 — Popup 내용은 열려 있는 동안만 마운트되므로, 그동안만 뒤 페이지의 터치 스크롤을 막는다.
 * Root 를 늘 렌더하는 창이 많아 DialogContent 함수 안에서 훅을 부르면 닫혀 있을 때도 막힌다
 */
export function TouchScrollGuard() {
  useTouchScrollGuard();
  return null;
}
