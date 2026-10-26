"use client";

import { useSyncExternalStore } from "react";

/** 구독할 것이 없다 — 값은 하이드레이션 전후로만 바뀐다 */
const subscribe = () => () => {};

/**
 * 하이드레이션이 끝났는지. 서버 렌더와 하이드레이션 첫 렌더에서는 false, 그 뒤와 클라이언트 이동으로 마운트될 때는 처음부터 true.
 * 기기에만 있는 값(되살린 쿼리 캐시 · localStorage)으로 그리는 부분을 이 뒤로 미뤄 서버 HTML 과 어긋나지 않게 한다
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
