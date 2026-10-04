"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

/** 요소의 높이(px, border-box). 크기가 바뀌면 다시 렌더한다. 재기 전(첫 렌더 · 요소 없음)에는 0 */
export function useElementHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      // borderBoxSize 가 없는 브라우저(Safari 15.4 미만)는 offsetHeight 로
      setHeight(entry?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return height;
}
