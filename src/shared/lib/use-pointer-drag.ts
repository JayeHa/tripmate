"use client";

import { type PointerEvent, type PointerEventHandler, useRef, useState } from "react";

/** 시작점 대비 포인터 이동량(px) */
export type DragDelta = { dx: number; dy: number };

/** 드래그할 요소에 그대로 펼쳐 붙이는 핸들러 묶음 */
export type PointerDragHandlers = {
  onPointerDown: PointerEventHandler;
  onPointerMove: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onPointerCancel: PointerEventHandler;
  onLostPointerCapture: PointerEventHandler;
};

type UsePointerDragOptions<T extends NonNullable<unknown>> = {
  /** 누른 순간의 기준값(예: 그때 너비 · 높이). 드래그 중에는 이 값과 이동량으로 새 값을 계산한다 */
  start: () => T;
  /** 움직일 때마다 */
  move: (start: T, delta: DragDelta) => void;
  /** 끝났을 때(놓음 · 취소 · 캡처 풀림 · 버튼이 이미 떼어짐) */
  end?: (start: T) => void;
};

/**
 * 「끌어서 값 하나 조절」 하는 드래그 — 경계선 · 패널 핸들 · 시트 손잡이 같은 것.
 * 목록 순서 바꾸기 · 다른 영역에 놓기처럼 놓을 자리 계산 · 자동 스크롤 · 키보드 대체가 필요한 드래그앤드롭은
 * 이 훅이 아니라 전용 라이브러리로 한다.
 *
 * - pointer capture 로 포인터가 지도(캔버스) 위나 창 밖으로 나가도 이벤트가 이 요소로 온다
 * - pointerup 이 오지 않는 경우(창 밖에서 떼기 · alt-tab)도 cancel · lostpointercapture · 「buttons === 0 인 move」 에서 끝낸다
 * - window 리스너를 쓰지 않아 요소가 언마운트되면 남는 것이 없다
 *
 * active 는 드래그 중일 때의 기준값(start 결과), 아니면 null. 그래서 start 는 null 을 돌려주면 안 된다.
 */
export function usePointerDrag<T extends NonNullable<unknown>>({
  start,
  move,
  end,
}: UsePointerDragOptions<T>) {
  const [active, setActive] = useState<T | null>(null);
  const origin = useRef<{ x: number; y: number; value: T } | null>(null);

  /** 드래그를 끝낸다. 이미 끝났으면 아무것도 안 한다 */
  function finish() {
    const o = origin.current;
    if (!o) return;
    origin.current = null;
    setActive(null);
    end?.(o.value);
  }

  const handlers: PointerDragHandlers = {
    onPointerDown(e: PointerEvent) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const value = start();
      origin.current = { x: e.clientX, y: e.clientY, value };
      setActive(() => value);
    },
    onPointerMove(e: PointerEvent) {
      const o = origin.current;
      if (!o) return;
      if (e.buttons === 0) return finish();
      move(o.value, { dx: e.clientX - o.x, dy: e.clientY - o.y });
    },
    onPointerUp: finish,
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  };

  return { active, dragging: active !== null, handlers };
}
