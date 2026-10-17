"use client";

import { useEffect, useState } from "react";

/**
 * 켜져 있는 동안 화면이 꺼지지 않게 한다(Screen Wake Lock). 걸렸는지를 돌려준다.
 * 화면을 벗어나면 브라우저가 풀어 버려서, 돌아오면(visibilitychange) 다시 건다. 꺼지거나 사라지면 푼다.
 * 지원하지 않거나(오래된 브라우저 · 안전하지 않은 주소) 거부되면(배터리 절약 모드) 조용히 false
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
 */
export function useWakeLock(enabled: boolean): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let done = false;
    /** 건다 — 이미 걸려 있거나 화면이 안 보이면 하지 않는다 */
    const request = async () => {
      if (done || document.visibilityState !== "visible" || (sentinel && !sentinel.released)) {
        return;
      }
      try {
        const next = await navigator.wakeLock.request("screen");
        if (done) {
          void next.release();
          return;
        }
        sentinel = next;
        setHeld(true);
        next.addEventListener("release", () => setHeld(false));
      } catch {
        setHeld(false);
      }
    };
    const onVisible = () => void request();
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release();
      setHeld(false);
    };
  }, [enabled]);
  return held;
}
