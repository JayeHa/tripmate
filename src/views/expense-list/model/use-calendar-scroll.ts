"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/** 프로그램 스크롤이 끝나지 않아도 잠금을 푸는 시간 — 부드러운 스크롤이 멈췄거나(탭이 가려짐) 사용자가 끼어들었을 때 */
const LOCK_MS = 1500;

type CalendarScrollOptions = {
  /** 스크롤되는 칸. 없으면 페이지(window) — 모바일. PC 는 표의 스크롤 칸 */
  scroller?: RefObject<HTMLElement | null>;
  /** 맨 위에 있을 때 고를 키(PC 레일의 「전체」). 누르면 맨 위로 간다 */
  topKey?: string;
};

/**
 * 가계부 목록의 날짜 고르기(모바일 달력 띠 · PC 날짜 레일) ↔ 날짜 묶음. 고르면 그 묶음 머리가 기준선에 오도록 스크롤하고,
 * 스크롤하면 기준선을 지난 마지막 묶음을 고른다(맨 아래에 닿으면 화면에 머리가 보이는 마지막 묶음, 아무것도 안 지났으면 맨 위 키). 누른 뒤 스크롤하는 동안은
 * 지나가는 날들로 선택이 튀지 않게 잠근다. 기준선 = 붙어 있는(sticky) 요소(`stickyRef` — 모바일은 달력 띠, PC 는 표 머리)의 아래 끝
 */
export function useCalendarScroll(
  keys: string[],
  { scroller, topKey }: CalendarScrollOptions = {},
) {
  const [selected, setSelected] = useState(topKey ?? keys[0] ?? "");
  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const lock = useRef<{ key: string; until: number } | null>(null);
  // 묶음 키 — 목록은 렌더마다 새 배열이라 스크롤 구독을 다시 걸지 않게 ref 로 본다
  const keysRef = useRef(keys);
  useEffect(() => {
    keysRef.current = keys;
  });

  /** 스크롤 칸의 위 끝 · 높이 · 스크롤 위치 — 페이지면 뷰포트 */
  function frame() {
    const el = scroller?.current;
    if (!el) {
      const doc = document.documentElement;
      return {
        top: 0,
        height: window.innerHeight,
        scrollTop: window.scrollY,
        max: doc.scrollHeight - window.innerHeight,
      };
    }
    return {
      top: el.getBoundingClientRect().top,
      height: el.clientHeight,
      scrollTop: el.scrollTop,
      max: el.scrollHeight - el.clientHeight,
    };
  }

  /** 붙어 있을 때 기준 요소의 아래 끝(뷰포트 y) */
  function lineY() {
    const sticky = stickyRef.current;
    if (!sticky) return frame().top;
    return (
      frame().top + (Number.parseFloat(getComputedStyle(sticky).top) || 0) + sticky.offsetHeight
    );
  }

  /** 잠금의 상태 — 아직 가는 중 · 목표에 닿음 · 시간이 지나 풀림 */
  function lockState(held: { key: string; until: number }, line: number) {
    const top = sectionRefs.current.get(held.key)?.getBoundingClientRect().top;
    const reached =
      held.key === topKey
        ? frame().scrollTop < 2
        : top !== undefined && Math.abs(top - line + 1) <= 2;
    if (reached) return "reached";
    return Date.now() < held.until ? "moving" : "expired";
  }

  useEffect(() => {
    const target: HTMLElement | Window = scroller?.current ?? window;
    /** 기준선을 지난 마지막 묶음을 고른다. 잠긴 동안은 목표에 닿았는지만 본다 */
    function onScroll() {
      const line = lineY() + 1;
      const held = lock.current;
      if (held) {
        const state = lockState(held, line);
        if (state === "moving") return;
        lock.current = null;
        // 목표에 닿아 풀렸으면 그 키 그대로 — 아래 계산은 기준선과 1px 차이로 이웃 묶음을 고를 수 있다
        if (state === "reached") {
          setSelected(held.key);
          return;
        }
      }
      const f = frame();
      // 맨 위면 맨 위 키(PC 「전체」) — 외화가 없으면 첫 묶음 머리가 처음부터 기준선에 붙어 있어 아래 계산으로는 가릴 수 없다
      if (topKey !== undefined && f.scrollTop < 2) {
        setSelected(topKey);
        return;
      }
      // 맨 아래까지 내렸으면 기준선에 못 닿는 마지막 날들도 고를 수 있게 — 화면 안에 머리가 보이는 마지막 묶음.
      // 처음부터 스크롤할 것이 없으면(짧은 목록) 맨 아래가 아니라 맨 위로 본다
      const limit = f.scrollTop > 0 && f.scrollTop >= f.max - 2 ? f.top + f.height : line;
      const all = keysRef.current;
      // 아직 아무 묶음 머리도 기준선을 지나지 않았으면 맨 위 키(PC 「전체」), 없으면 첫 묶음
      let current = topKey ?? all[0];
      for (const key of all) {
        const top = sectionRefs.current.get(key)?.getBoundingClientRect().top;
        if (top !== undefined && top <= limit) current = key;
      }
      if (current !== undefined) setSelected(current);
    }
    target.addEventListener("scroll", onScroll, { passive: true });
    // 마운트할 때 이미 내려가 있을 수 있다(뒤로 가기 복원 · PC → 모바일 재마운트) — 지금 위치로 한 번 맞춘다
    onScroll();
    return () => target.removeEventListener("scroll", onScroll);
    // 스크롤 칸 · 맨 위 키는 화면마다 고정이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 고른 칸이 띠 안에서 보이게 가로로 옮긴다(모바일 — 긴 여행은 띠가 가로로 넘친다) */
  useEffect(() => {
    const strip = stickyRef.current;
    const cell = strip?.querySelector<HTMLElement>(`[data-key="${selected}"]`);
    if (!strip || !cell) return;
    const left = cell.offsetLeft - (strip.clientWidth - cell.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [selected]);

  /** 날짜를 골랐다 — 그 묶음 머리를 기준선에 맞춘다. 맨 위 키면 맨 위로 */
  function go(key: string) {
    const section = sectionRefs.current.get(key);
    if (key !== topKey && !section) return;
    setSelected(key);
    lock.current = { key, until: Date.now() + LOCK_MS };
    const top = section ? frame().scrollTop + section.getBoundingClientRect().top - lineY() : 0;
    (scroller?.current ?? window).scrollTo({ top, behavior: "smooth" });
  }

  /** 묶음의 ref — 키마다 하나 */
  function sectionRef(key: string) {
    return (el: HTMLElement | null) => {
      if (el) sectionRefs.current.set(key, el);
      else sectionRefs.current.delete(key);
    };
  }

  return { selected, go, stickyRef, sectionRef };
}
