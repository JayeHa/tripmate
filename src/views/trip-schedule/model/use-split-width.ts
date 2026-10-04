"use client";

import { type KeyboardEvent, useState } from "react";

import { usePointerDrag } from "@/shared/lib/use-pointer-drag";
import { useWindowWidth } from "@/shared/lib/use-window-width";

import {
  clampListWidth,
  LIST_DEFAULT_WIDTH,
  LIST_MIN_WIDTH,
  listMaxWidth,
  splitPresets,
} from "../lib/split";

/** 화살표 키 한 번에 바뀌는 너비 */
const KEY_STEP = 16;

/**
 * PC 일정 목록 너비와 경계선 드래그. 드래그 중에는 경계선을 파랗게 그린다.
 * 저장한 값(wanted)과 화면에 적용되는 값(width)을 나눈다 — 창이 줄면 width 는 최대로 잘리고,
 * 다시 넓히면 원래 원하던 너비로 돌아간다. 드래그 · 프리셋 강조 · 접근성 값은 모두 width 기준이다.
 */
export function useSplitWidth() {
  const viewport = useWindowWidth();
  const [wanted, setWanted] = useState(LIST_DEFAULT_WIDTH);
  const width = clampListWidth(wanted, viewport);

  /** 범위 안으로 잘라서 정한다 */
  function setWidth(next: number) {
    setWanted(clampListWidth(next, viewport));
  }

  /** 경계선 드래그 — 누른 순간의 화면 너비에서 가로 이동량만큼 */
  const drag = usePointerDrag({
    start: () => width,
    move: (startWidth, { dx }) => setWidth(startWidth + dx),
  });

  /** 키보드로 조절 — ←/→ 16px, Home/End 최소 · 최대, Enter 기본 너비 (WAI-ARIA window splitter) */
  function onKeyDown(e: KeyboardEvent) {
    const next = {
      ArrowLeft: width - KEY_STEP,
      ArrowRight: width + KEY_STEP,
      Home: LIST_MIN_WIDTH,
      End: listMaxWidth(viewport),
      Enter: LIST_DEFAULT_WIDTH,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setWidth(next);
  }

  return {
    width,
    minWidth: LIST_MIN_WIDTH,
    maxWidth: listMaxWidth(viewport),
    onKeyDown,
    dragging: drag.active !== null,
    /**
     * 자리 잡은 너비 — 드래그 중에는 시작 너비를 유지한다. 지도는 이 값이 바뀔 때 핀을 다시 맞춘다
     * (드래그하는 동안 계속 맞추면 지도가 흔들린다)
     */
    settledWidth: drag.active ?? width,
    presets: splitPresets(viewport),
    setWidth,
    dragHandlers: drag.handlers,
    reset: () => setWidth(LIST_DEFAULT_WIDTH),
  };
}
