"use client";

import { type CSSProperties, useEffect, useEffectEvent, useState } from "react";
import { createPortal } from "react-dom";

/** 토스트가 떠 있는 시간 — 한 줄 알림 1.6s, 「제목 · 설명」 안내형 2.6s */
const SHOW_MS = 1600;
const GUIDE_MS = 2600;
/** 빈 알림 영역을 붙인 뒤 글을 넣기까지 */
const FILL_MS = 50;

/**
 * 보일 토스트 한 번. 같은 문구를 다시 띄울 때도 id 가 달라 시간을 다시 잰다.
 * detail 이 있으면 안내형 — 굵은 text 뒤에 「 · detail」, 조금 더 오래 보인다
 */
export type ToastMessage = {
  text: string;
  detail?: string;
  id: number;
  /** 글 뒤의 버튼 하나(「다시 받기」) — 있으면 토스트를 누를 수 있다 */
  action?: { label: string; onClick: () => void };
};

type ToastProps = {
  /** null 이면 아무것도 그리지 않는다 */
  message: ToastMessage | null;
  /** 시간이 지나 사라질 때 부른다 — 부른 쪽이 message 를 null 로 돌린다 */
  onDone: () => void;
  /** 모바일에서 더 올릴 높이(px) — 하단 탭 위에 다른 바가 붙은 화면(가계부 합계 바). PC 는 그대로 */
  mobileOffset?: number;
};

/**
 * 화면 아래 가운데에 잠깐 떴다 사라지는 한 줄 알림(모바일은 하단 탭 위 110, PC 는 28). 새 토스트가 이전 것을 대체한다. 열린 창(다이얼로그 z-50) 위에도 보이게 body 에 그리고,
 * 누르는 것을 막지 않는다(pointer-events-none — 버튼(action)만 누를 수 있다).
 *
 * 스크린리더는 이미 있는 live region 의 변화만 읽는 경우가 많아, 빈 `role="status"` 를 먼저 붙이고 다음 틱에 글을 넣는다.
 * 늘 붙여 두지 않는 이유: 모달이 열릴 때 바깥 요소는 aria-hidden 이 되는데, 토스트는 주로 모달 위에 뜬다 —
 * 모달이 열린 뒤 새로 붙인 영역은 가려지지 않는다
 */
export function Toast({ message, onDone, mobileOffset = 0 }: ToastProps) {
  const done = useEffectEvent(onDone);
  // 지금 영역에 넣은 토스트의 id — 다른 토스트로 바뀐 순간에는 지난 글을 보이지 않는다
  const [filled, setFilled] = useState<number | null>(null);
  useEffect(() => {
    if (!message) return;
    const fill = setTimeout(() => setFilled(message.id), FILL_MS);
    const hide = setTimeout(done, message.detail ? GUIDE_MS : SHOW_MS);
    return () => {
      clearTimeout(fill);
      clearTimeout(hide);
    };
  }, [message]);
  if (!message) return null;
  return createPortal(
    <div
      role="status"
      style={{ "--toast-offset": `${mobileOffset}px` } as CSSProperties}
      className="pointer-events-none fixed bottom-[calc(110px+var(--toast-offset)+env(safe-area-inset-bottom))] left-1/2 z-100 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 lg:bottom-7"
    >
      {filled === message.id && (
        <span className="block rounded-[20px] bg-ink-900/92 px-4.5 py-2.5 text-center text-sm font-semibold text-white">
          {message.detail ? (
            <>
              <b className="font-extrabold">{message.text}</b> · {message.detail}
            </>
          ) : (
            message.text
          )}
          {message.action && (
            <button
              type="button"
              onClick={message.action.onClick}
              className="pointer-events-auto ml-2.5 font-extrabold text-primary"
            >
              {message.action.label}
            </button>
          )}
        </span>
      )}
    </div>,
    document.body,
  );
}
