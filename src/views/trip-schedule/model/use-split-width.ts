"use client";

import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

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
  // 드래그를 시작할 때의 너비. 드래그 중이 아니면 null
  const [dragStart, setDragStart] = useState<number | null>(null);
  const dragging = dragStart !== null;
  const width = clampListWidth(wanted, viewport);

  /** 범위 안으로 잘라서 정한다 */
  function setWidth(next: number) {
    setWanted(clampListWidth(next, viewport));
  }

  // 드래그 시작점. 끝나면 null
  const origin = useRef<{ x: number; width: number } | null>(null);

  /**
   * 경계선 드래그 핸들러 — 경계선 요소에 그대로 펼쳐 붙인다.
   * pointer capture 로 포인터가 지도(캔버스) 위나 창 밖으로 나가도 이벤트가 경계선으로 온다.
   * 창 밖에서 버튼을 놓거나 alt-tab 처럼 pointerup 이 오지 않는 경우는 cancel · lostpointercapture ·
   * 「버튼이 이미 떼어짐(buttons === 0)」 에서 끝낸다. window 리스너가 없어 언마운트돼도 남는 것이 없다.
   */
  const end = () => {
    origin.current = null;
    setDragStart(null);
  };
  const dragHandlers = {
    onPointerDown(e: PointerEvent) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      origin.current = { x: e.clientX, width };
      setDragStart(width);
    },
    onPointerMove(e: PointerEvent) {
      if (!origin.current) return;
      if (e.buttons === 0) return end();
      setWidth(origin.current.width + e.clientX - origin.current.x);
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  };

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
    dragging,
    /**
     * 자리 잡은 너비 — 드래그 중에는 시작 너비를 유지한다. 지도는 이 값이 바뀔 때 핀을 다시 맞춘다
     * (드래그하는 동안 계속 맞추면 지도가 흔들린다)
     */
    settledWidth: dragStart ?? width,
    presets: splitPresets(viewport),
    setWidth,
    dragHandlers,
    reset: () => setWidth(LIST_DEFAULT_WIDTH),
  };
}
