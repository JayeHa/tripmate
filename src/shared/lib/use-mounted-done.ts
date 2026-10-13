"use client";

import { useEffect, useRef } from "react";

/**
 * 완료 콜백을 이 창이 아직 떠 있을 때만 부르게 감싼다. 오프라인으로 멈춘 요청은 창을 닫을 수 있어서,
 * 늦게 끝난 요청이 그사이 연 다른 창을 닫지 않게(onDone 은 「지금 열린 창」 을 닫는다)
 */
export function useMountedDone(onDone: () => void) {
  const mountedRef = useMountedRef();
  return () => {
    if (mountedRef.current) onDone();
  };
}

/** 이 컴포넌트가 아직 마운트돼 있는지(ref) — 늦게 끝난 요청이 결과를 어디에 보일지 고를 때 */
export function useMountedRef() {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return mountedRef;
}
