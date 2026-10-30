"use client";

import { useState } from "react";

/** 가이드 보기 — 카드 목록 · 지도 */
export type GuideView = "list" | "map";

/** 기기별로 기억한다 — 일행과 나누지 않는다(모든 여행 · 탭에 하나) */
const KEY = "tm-guide-view";

/** 저장된 보기. 사생활 모드 · 막힌 저장소에서는 목록 */
function read(): GuideView {
  try {
    return localStorage.getItem(KEY) === "map" ? "map" : "list";
  } catch {
    return "list";
  }
}

/**
 * 가이드 「목록 | 지도」 — 고른 보기를 기기에 기억한다. 막혀 있으면 이번 화면에서만.
 * 첫 렌더에서 읽는다 — 여행 홈은 화면 폭을 안 뒤(클라이언트)에만 그려서 하이드레이션과 어긋나지 않는다
 */
export function useGuideView() {
  const [view, setViewState] = useState<GuideView>(read);

  /** 보기를 바꾸고 저장한다 */
  function setView(next: GuideView) {
    setViewState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // 저장할 수 없으면 이 화면에서만 기억한다
    }
  }

  return { view, setView };
}
