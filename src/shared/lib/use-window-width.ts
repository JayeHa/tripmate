"use client";

import { useSyncExternalStore } from "react";

/** 창 너비(px). 창 크기가 바뀌면 다시 렌더한다. 서버에서는 기준값(1280)을 쓴다 */
export function useWindowWidth(serverWidth = 1280): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => window.innerWidth,
    () => serverWidth,
  );
}
