"use client";

import { useEffect, useRef } from "react";

/**
 * 완료 콜백을 이 창이 아직 떠 있을 때만 부르게 감싼다. 오프라인으로 멈춘 요청은 창을 닫을 수 있어서,
 * 늦게 끝난 요청이 그사이 연 다른 창을 닫지 않게(onDone 은 「지금 열린 창」 을 닫는다)
 */
export function useMountedDone(onDone: () => void) {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return () => {
    if (mountedRef.current) onDone();
  };
}
