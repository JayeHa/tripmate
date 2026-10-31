import { useRef } from "react";

/** 손가락으로 이만큼(px) 밀면 넘긴다 */
const SWIPE_PX = 50;

/**
 * 현장용 페이지를 손가락으로 밀어 넘기기 — 판을 감싼 칸의 pointer 핸들러를 돌려준다.
 * 확대 중(paused)에는 한 손가락이 그림을 움직이므로 넘기지 않는다. 두 손가락이 닿았던 동작(오므리기)도 넘기기로 치지 않는다
 */
export function usePageSwipe(go: (step: 1 | -1) => void, paused: boolean) {
  const startX = useRef<number | null>(null);
  // 지금 닿아 있는 손가락 — 둘째 손가락이 닿으면 이번 동작은 넘기기가 아니다
  const fingers = useRef(new Set<number>());

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return;
      fingers.current.add(e.pointerId);
      startX.current = fingers.current.size === 1 && !paused ? e.clientX : null;
    },
    onPointerUp: (e: React.PointerEvent) => {
      fingers.current.delete(e.pointerId);
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      startX.current = null;
      if (!paused && Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      fingers.current.delete(e.pointerId);
      startX.current = null;
    },
  };
}
