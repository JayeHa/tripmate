"use client";

import { useSyncExternalStore } from "react";

/** 브라우저의 online · offline 이벤트를 듣는다 */
function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * 연결되어 있는가 — 브라우저(`navigator.onLine`)가 알려 주는 대로. 와이파이에 붙었지만 인터넷이 안 되는 경우는 true 로 남는다.
 * 서버에서 그릴 때 · 하이드레이션 중에는 true(오프라인 띠가 깜빡이지 않게)
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
