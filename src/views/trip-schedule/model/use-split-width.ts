"use client";

import { type PointerEvent as ReactPointerEvent, useState } from "react";

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

  /** 경계선을 누른 채 끌면 목록 너비가 따라온다. 시작점은 화면에 보이는 너비 */
  function startDrag(e: ReactPointerEvent) {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = width;
    const move = (ev: PointerEvent) => setWidth(w0 + ev.clientX - x0);
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    setDragging(true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return {
    width,
    dragging,
    presets: splitPresets(viewport),
    setWidth,
    startDrag,
    reset: () => setWidth(LIST_DEFAULT_WIDTH),
  };
}
