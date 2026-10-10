"use client";

import { useEffect } from "react";

import { hasScrollerFor } from "./touch-scroll";

/** 지금 이 가드를 쓰는(열려 있는) 창 수 — 중첩 창이 있어도 리스너는 하나만 단다 */
let users = 0;
let last = { x: 0, y: 0 };

/** 손가락을 댄 자리를 기억한다 */
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0];
  if (t) last = { x: t.clientX, y: t.clientY };
}

/**
 * 직전 자리에서 움직인 방향으로 스크롤될 칸이 손가락 아래에 없으면 기본 동작을 막는다.
 * 두 손가락(확대)은 건드리지 않는다
 */
function onTouchMove(e: TouchEvent) {
  const t = e.touches[0];
  if (!t || e.touches.length > 1) return;
  const dx = t.clientX - last.x;
  const dy = t.clientY - last.y;
  last = { x: t.clientX, y: t.clientY };
  if (e.cancelable && !hasScrollerFor(e.target, dx, dy)) e.preventDefault();
}

/**
 * 창(모달)이 떠 있는 동안 터치 스크롤이 뒤 페이지로 넘어가지 않게 한다. 창의 Popup 안에서 부른다(열려 있는 동안만 마운트된다).
 *
 * Base UI 의 스크롤 잠금은 html · body 에 overflow: hidden 을 거는 방식이라 iOS Safari 에서 주소창이 접혀 있으면 듣지 않는다
 * (`@base-ui/utils/useScrollLock` 의 주석). 그래서 창 안에 스크롤할 내용이 없거나 끝에 닿았을 때, 스크림을 끌 때 페이지가 움직였다.
 * 손가락 아래에서 그 방향으로 스크롤되는 칸이 없으면 touchmove 를 막는다 — 창 안의 목록 · 가로 칩 줄은 그대로 스크롤되고,
 * 스크롤되지 않는 방향의 고무줄 튕김(좌우 흔들림)도 함께 사라진다
 */
export function useTouchScrollGuard() {
  useEffect(() => {
    users += 1;
    if (users === 1) {
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
    }
    return () => {
      users -= 1;
      if (users === 0) {
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove", onTouchMove);
      }
    };
  }, []);
}
