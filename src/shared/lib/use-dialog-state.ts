"use client";

import { useEffect, useState } from "react";

import { nextHeld, nextOpenCount } from "./dialog-state";

/**
 * 닫히는 동안(페이드 아웃)에도 창 내용을 그리도록 열려 있던 동안의 마지막 값을 돌려준다.
 * 부모가 닫으며 대상을 null 로 바꿔도 빈 틀이 잠깐 남지 않는다. 렌더 중에 맞춘다 — 이펙트를 거치면 한 프레임 비어 보인다
 */
export function useHeldWhileClosing<T>(open: boolean, value: T): T {
  const [held, setHeld] = useState(value);
  const next = nextHeld(held, open, value);
  if (next !== held) setHeld(next);
  return next;
}

/**
 * 닫힘 → 열림마다 1 늘어나는 수. 창 내용의 key 로 쓰면 열 때마다 새로 그린다 —
 * 대상을 값으로 비교하면 같은 대상으로 다시 열 때 지난 입력 · 선택이 남는다
 */
export function useOpenCount(open: boolean): number {
  const [state, setState] = useState({ open, count: open ? 1 : 0 });
  const next = nextOpenCount(state, open);
  if (next !== state) setState(next);
  return next.count;
}

/**
 * 창 안의 요청 중(잠김)을 창을 쥔 쪽에 알린다 — 바뀔 때마다, 사라질 때는 false.
 * 저장 · 삭제가 끝나 창이 닫히며 내용이 언마운트될 때 마지막 값이 true 로 남으면, 다음에 연 창이 Esc · 바깥 누르기로 닫히지 않는다
 */
export function useReportLock(locked: boolean, onLockChange?: (locked: boolean) => void) {
  useEffect(() => {
    onLockChange?.(locked);
    return () => onLockChange?.(false);
  }, [locked, onLockChange]);
}
