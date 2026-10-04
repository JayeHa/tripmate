"use client";

import { useEffect, useEffectEvent } from "react";
import { createPortal } from "react-dom";

/** 토스트가 떠 있는 시간 */
const SHOW_MS = 2000;

type ToastProps = {
  /** 보일 문구. null 이면 아무것도 그리지 않는다 */
  message: string | null;
  /** 시간이 지나 사라질 때 부른다 — 부른 쪽이 message 를 null 로 돌린다 */
  onDone: () => void;
};

/**
 * 화면 아래 가운데에 잠깐 떴다 사라지는 한 줄 알림. 열린 창(다이얼로그 z-50) 위에도 보이게 body 에 그리고,
 * 누르는 것을 막지 않는다(pointer-events-none). 문구가 바뀌면 시간을 다시 잰다
 */
export function Toast({ message, onDone }: ToastProps) {
  const done = useEffectEvent(onDone);
  useEffect(() => {
    if (!message) return;
    const handle = setTimeout(done, SHOW_MS);
    return () => clearTimeout(handle);
  }, [message]);
  if (!message) return null;
  return createPortal(
    <div
      role="status"
      className="pointer-events-none fixed bottom-7 left-1/2 z-100 -translate-x-1/2 rounded-full bg-ink-900/92 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white"
    >
      {message}
    </div>,
    document.body,
  );
}
