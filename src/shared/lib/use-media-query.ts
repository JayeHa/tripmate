"use client";

import { useSyncExternalStore } from "react";

/**
 * 미디어 쿼리 일치 여부. 서버 렌더와 하이드레이션 첫 렌더에서는 알 수 없어 null 이다.
 * CSS 로 숨기면 양쪽이 다 마운트되는 경우(지도처럼 무거운 것)에만 쓰고, 단순 배치는 Tailwind 반응형으로 한다.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}
