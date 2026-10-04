"use client";

import { type PointerEvent as ReactPointerEvent, useState } from "react";

import { clampListWidth, LIST_DEFAULT_WIDTH } from "../lib/split";

/**
 * PC 일정 목록 너비와 경계선 드래그. 드래그 중에는 경계선을 파랗게 그린다.
 * 화면이 줄어 최대보다 넓어지면 CSS max-width 가 막고, 다음 조작 때 값이 범위 안으로 돌아온다.
 */
export function useSplitWidth() {
  const [width, setWidthRaw] = useState(LIST_DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);

  /** 범위 안으로 잘라서 정한다 */
  function setWidth(next: number) {
    setWidthRaw(clampListWidth(next, window.innerWidth));
  }

  /** 경계선을 누른 채 끌면 목록 너비가 따라온다 */
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

  return { width, dragging, setWidth, startDrag, reset: () => setWidth(LIST_DEFAULT_WIDTH) };
}
