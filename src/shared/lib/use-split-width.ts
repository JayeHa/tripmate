"use client";

import { type KeyboardEvent, useState } from "react";

import { clampSplitWidth, draggedWidth, type SplitConfig, splitMaxWidth } from "./split";
import { usePointerDrag } from "./use-pointer-drag";
import { useWindowWidth } from "./use-window-width";

/** 화살표 키 한 번에 바뀌는 너비 */
const KEY_STEP = 16;

/**
 * PC 3분할의 경계선 — 쥔 칸의 너비와 드래그 · 키보드. 드래그 중에는 경계선을 파랗게 그린다(`dragging`).
 * 원하는 값(wanted)과 화면에 적용되는 값(width)을 나눈다 — 창이 줄면 width 는 최대로 잘리고,
 * 다시 넓히면 원래 원하던 너비로 돌아간다. 드래그 · 접근성 값은 모두 width 기준이다.
 * `config` 는 화면마다 고정값이다(모듈 상수로 넘긴다)
 */
export function useSplitWidth(config: SplitConfig) {
  const viewport = useWindowWidth();
  const [wanted, setWanted] = useState(config.defaultWidth);
  const width = clampSplitWidth(config, wanted, viewport);
  const maxWidth = splitMaxWidth(config, viewport);

  /** 범위 안으로 잘라서 정한다 */
  function setWidth(next: number) {
    setWanted(clampSplitWidth(config, next, viewport));
  }

  /** 경계선 드래그 — 누른 순간의 너비에서 가로 이동량만큼 */
  const drag = usePointerDrag({
    start: () => width,
    move: (startWidth, { dx }) => setWidth(draggedWidth(config, startWidth, dx)),
  });

  /**
   * 키보드로 조절(WAI-ARIA window splitter) — ←/→ 는 경계선을 16px 옮긴다(쥔 칸이 오른쪽이면 ← 가 넓힌다),
   * Home/End 최소 · 최대, Enter 기본 너비
   */
  function onKeyDown(e: KeyboardEvent) {
    const step = config.side === "first" ? KEY_STEP : -KEY_STEP;
    const next = {
      ArrowLeft: width - step,
      ArrowRight: width + step,
      Home: config.min,
      End: maxWidth,
      Enter: config.defaultWidth,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setWidth(next);
  }

  return {
    width,
    minWidth: config.min,
    maxWidth,
    /** 지금 화면 너비 — 화면별 프리셋 계산용 */
    viewport,
    onKeyDown,
    dragging: drag.active !== null,
    /** 자리 잡은 너비 — 드래그 중에는 시작 너비를 유지한다(지도 맞추기처럼 드래그가 끝난 뒤에만 할 일에) */
    settledWidth: drag.active ?? width,
    setWidth,
    dragHandlers: drag.handlers,
    reset: () => setWidth(config.defaultWidth),
  };
}
