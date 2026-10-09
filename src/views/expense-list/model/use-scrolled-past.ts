"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * 페이지를 내려 `target` 이 붙는 줄(`line` 요소의 sticky top) 위로 완전히 사라졌는지 — 모바일 가계부의
 * 「+ 비용 추가」 가 사라지면 날짜 줄 · 플로팅 버튼을 보이려고. 스크롤마다 다시 잰다(처음 마운트 때도 한 번)
 */
export function useScrolledPast(
  target: RefObject<HTMLElement | null>,
  line: RefObject<HTMLElement | null>,
): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    /** 버튼의 아래 끝이 붙는 줄보다 위인가 */
    function measure() {
      const el = target.current;
      const sticky = line.current;
      if (!el || !sticky) return;
      const top = Number.parseFloat(getComputedStyle(sticky).top) || 0;
      setPast(el.getBoundingClientRect().bottom <= top);
    }
    window.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", measure);
  }, [target, line]);
  return past;
}
