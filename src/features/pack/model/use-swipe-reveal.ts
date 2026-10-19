"use client";

import { type MouseEvent, type PointerEvent, useRef, useState } from "react";

/** 왼쪽으로 밀면 드러나는 「삭제」 폭 */
export const SWIPE_REVEAL = 76;
/** 이만큼 움직여야 미는 것으로 본다 — 그 전에는 누르기 · 세로 스크롤 */
const SLOP = 6;

/**
 * 줄을 왼쪽으로 밀어 뒤의 버튼을 드러낸다(PC 는 마우스로 끌기). 절반 넘게 밀고 놓으면 열린 채로, 아니면 닫는다.
 * 열림 여부는 부모가 쥔다(한 번에 한 줄만 열리게). 민 직후의 click 은 삼켜서 줄을 누른 것으로 치지 않는다.
 * 줄에는 `touch-action: pan-y` 를 걸어 세로 스크롤은 브라우저에 맡긴다 — 스크롤이 시작되면 pointercancel 로 끝난다
 */
export function useSwipeReveal(open: boolean, onOpenChange: (open: boolean) => void) {
  const [dragX, setDragX] = useState<number | null>(null);
  const start = useRef<{ pointerId: number; x: number; base: number; moved: boolean } | null>(null);
  const lastX = useRef(0);
  const swallowClick = useRef(false);

  /** 끝내기 — 움직였으면 놓은 자리로 열림 · 닫힘을 정한다 */
  function finish(e: PointerEvent, settle: boolean) {
    const s = start.current;
    if (!s || s.pointerId !== e.pointerId) return;
    start.current = null;
    if (!s.moved) return;
    setDragX(null);
    if (!settle) return;
    swallowClick.current = true;
    onOpenChange(lastX.current < -SWIPE_REVEAL / 2);
  }

  return {
    /** 지금 줄의 x(px) — 끄는 중이면 손가락 자리, 아니면 열림 · 닫힘 자리 */
    x: dragX ?? (open ? -SWIPE_REVEAL : 0),
    dragging: dragX !== null,
    handlers: {
      onPointerDown(e: PointerEvent) {
        swallowClick.current = false;
        if (e.button !== 0 || start.current) return;
        start.current = {
          pointerId: e.pointerId,
          x: e.clientX,
          base: open ? -SWIPE_REVEAL : 0,
          moved: false,
        };
      },
      onPointerMove(e: PointerEvent) {
        const s = start.current;
        if (!s || s.pointerId !== e.pointerId) return;
        const dx = e.clientX - s.x;
        if (!s.moved) {
          if (Math.abs(dx) < SLOP) return;
          s.moved = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        lastX.current = Math.max(-SWIPE_REVEAL, Math.min(0, s.base + dx));
        setDragX(lastX.current);
      },
      onPointerUp: (e: PointerEvent) => finish(e, true),
      onPointerCancel: (e: PointerEvent) => finish(e, false),
      onClickCapture(e: MouseEvent) {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.stopPropagation();
      },
    },
  };
}
