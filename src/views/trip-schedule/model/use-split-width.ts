"use client";

import { type PointerEvent, useRef, useState } from "react";

import { useWindowWidth } from "@/shared/lib/use-window-width";

import { clampListWidth, LIST_DEFAULT_WIDTH, splitPresets } from "../lib/split";

/**
 * PC 일정 목록 너비와 경계선 드래그. 드래그 중에는 경계선을 파랗게 그린다.
 * 저장한 값(wanted)과 화면에 적용되는 값(width)을 나눈다 — 창이 줄면 width 는 최대로 잘리고,
 * 다시 넓히면 원래 원하던 너비로 돌아간다. 드래그 · 프리셋 강조 · 접근성 값은 모두 width 기준이다.
 */
export function useSplitWidth() {
  const viewport = useWindowWidth();
  const [wanted, setWanted] = useState(LIST_DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);
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
    setDragging(false);
  };
  const dragHandlers = {
    onPointerDown(e: PointerEvent) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      origin.current = { x: e.clientX, width };
      setDragging(true);
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

  return {
    width,
    dragging,
    presets: splitPresets(viewport),
    setWidth,
    dragHandlers,
    reset: () => setWidth(LIST_DEFAULT_WIDTH),
  };
}
