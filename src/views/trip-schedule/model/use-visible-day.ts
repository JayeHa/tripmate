import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { pickVisibleDay } from "../lib/focus";

/** 스크롤을 직접 움직였다고 볼 입력 — 날짜로 이동한 뒤 붙잡아 둔 날을 놓는다 */
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

type VisibleDayOptions = {
  /** 스크롤을 듣는 칸. 없으면 window — 모바일은 페이지가 스크롤된다 */
  scroller?: RefObject<HTMLElement | null>;
  /** 날짜 묶음(`data-day-section`)을 감싼 요소 */
  list: RefObject<HTMLElement | null>;
  /** 스크롤 위치 → 목록이 보이기 시작하는 화면 y(모바일 sticky 아래 · PC 목록 칸 위). 날짜 머리가 여기를 지나면 그 날이다 */
  line: (scrollTop: number) => number;
  /** false 면 듣지 않는다(편집 중 · 하루씩 보기) */
  enabled: boolean;
  /** 보고 있는 날이 바뀌었다 — 부른 쪽이 `?day` · 칩 · 지도를 맞춘다 */
  onChange: (day: number) => void;
};

/** 스크롤을 듣고 움직일 대상. 칸을 넘기지 않았으면 window */
function targetOf(scroller: RefObject<HTMLElement | null> | undefined): HTMLElement | Window {
  return scroller?.current ?? window;
}

/** 지금 스크롤 위치 */
function scrollTopOf(target: HTMLElement | Window): number {
  return target instanceof Window ? document.documentElement.scrollTop : target.scrollTop;
}

/**
 * 이어서 보기에서 「지금 보고 있는 날」 — 날짜 머리가 기준선을 지난 마지막 날짜(프레임당 한 번 고른다). 바뀌면 onChange 로 알린다.
 * `scrollToDay` 는 그 날짜 머리를 기준선에 맞춰 스크롤하고, 사용자가 직접 스크롤하기 전까지 그 날을 붙잡아 둔다 —
 * 짧은 마지막 날처럼 머리가 기준선까지 못 올라와도 누른 날이 그대로 보이게
 */
export function useVisibleDay({ scroller, list, line, enabled, onChange }: VisibleDayOptions) {
  const latest = useRef({ scroller, list, line, enabled, onChange });
  useLayoutEffect(() => {
    latest.current = { scroller, list, line, enabled, onChange };
  });
  const locked = useRef<number | null>(null);
  // 마지막으로 알린 날 — 같은 날이면 다시 알리지 않는다
  const shown = useRef<number | null>(null);

  /** 날짜 머리 위치로 보고 있는 날을 다시 고른다. 바뀌었으면 알린다 */
  const scan = useCallback(() => {
    const { scroller: s, list: l, line: lineOf, enabled: on, onChange: notify } = latest.current;
    const root = l.current;
    if (!on || !root || locked.current !== null) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-day-section]"), (el) => ({
      day: Number(el.dataset.daySection),
      top: el.getBoundingClientRect().top,
    }));
    const day = pickVisibleDay(sections, lineOf(scrollTopOf(targetOf(s))) + 1);
    if (day === null || day === shown.current) return;
    shown.current = day;
    notify(day);
  }, []);

  useEffect(() => {
    const target = targetOf(scroller);
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };
    const release = () => {
      locked.current = null;
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    for (const e of USER_SCROLL_EVENTS) window.addEventListener(e, release, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      for (const e of USER_SCROLL_EVENTS) window.removeEventListener(e, release);
      cancelAnimationFrame(frame);
    };
  }, [scroller, scan]);

  /**
   * 그 날짜 머리를 기준선에 맞춰 스크롤하고 그 날로 붙잡아 둔다(바뀌었으면 onChange 로 알린다 — 붙잡은 동안은 스크롤로 고르지 않는다).
   * smooth 가 아니면 바로 옮긴다(처음 열 때 `?day` 로). 머리를 못 찾으면(아직 그리기 전) false
   */
  const scrollToDay = useCallback((day: number, smooth = true): boolean => {
    const { scroller: s, list: l, line: lineOf, onChange: notify } = latest.current;
    const head = l.current?.querySelector<HTMLElement>(`[data-day-section="${day}"]`);
    if (!head) return false;
    const target = targetOf(s);
    const top = scrollTopOf(target);
    locked.current = day;
    if (shown.current !== day) {
      shown.current = day;
      notify(day);
    }
    target.scrollTo({
      top: top + head.getBoundingClientRect().top - lineOf(top),
      behavior: smooth ? "smooth" : "instant",
    });
    return true;
  }, []);

  return { scrollToDay };
}
