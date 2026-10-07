"use client";

import { useEffect, useRef, useState } from "react";

/** 프로그램 스크롤이 끝나지 않아도 잠금을 푸는 시간 — 부드러운 스크롤이 멈췄거나(탭이 가려짐) 사용자가 끼어들었을 때 */
const LOCK_MS = 1500;

/**
 * 가계부 목록의 달력 띠 ↔ 날짜 묶음. 칸을 누르면 그 묶음 머리가 띠 바로 아래에 오도록 스크롤하고,
 * 스크롤하면 띠 아래를 지난 마지막 묶음을 고른다(맨 아래에 닿으면 화면에 머리가 보이는 마지막 묶음). 누른 뒤 스크롤하는 동안은 지나가는 날들로 선택이 튀지 않게 잠근다.
 * 페이지(window)가 스크롤되고 띠는 sticky 라, 띠가 붙었을 때의 아래 끝(sticky top + 높이)을 기준선으로 쓴다
 */
export function useCalendarScroll(keys: string[]) {
  const [selected, setSelected] = useState(keys[0] ?? "");
  const stripRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const lock = useRef<{ key: string; until: number } | null>(null);
  // 묶음 키 — 목록은 렌더마다 새 배열이라 스크롤 구독을 다시 걸지 않게 ref 로 본다
  const keysRef = useRef(keys);
  useEffect(() => {
    keysRef.current = keys;
  });

  /** 띠가 붙었을 때 아래 끝(뷰포트 y) */
  function lineY() {
    const strip = stripRef.current;
    if (!strip) return 0;
    return (Number.parseFloat(getComputedStyle(strip).top) || 0) + strip.offsetHeight;
  }

  useEffect(() => {
    /** 기준선을 지난 마지막 묶음을 고른다. 잠긴 동안은 목표에 닿았는지만 본다 */
    function onScroll() {
      const line = lineY() + 1;
      const held = lock.current;
      if (held) {
        const top = sectionRefs.current.get(held.key)?.getBoundingClientRect().top;
        if (Date.now() < held.until && top !== undefined && Math.abs(top - line + 1) > 2) return;
        lock.current = null;
      }
      const all = keysRef.current;
      // 맨 아래까지 내렸으면 기준선에 못 닿는 마지막 날들도 고를 수 있게 — 화면 안에 머리가 보이는 마지막 묶음
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const limit = atBottom ? window.innerHeight : line;
      let current = all[0];
      for (const key of all) {
        const top = sectionRefs.current.get(key)?.getBoundingClientRect().top;
        if (top !== undefined && top <= limit) current = key;
      }
      if (current !== undefined) setSelected(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    // 마운트할 때 이미 내려가 있을 수 있다(뒤로 가기 복원 · PC → 모바일 재마운트) — 지금 위치로 한 번 맞춘다
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** 고른 칸이 띠 안에서 보이게 가로로 옮긴다(긴 여행은 띠가 가로로 넘친다) */
  useEffect(() => {
    const strip = stripRef.current;
    const cell = strip?.querySelector<HTMLElement>(`[data-key="${selected}"]`);
    if (!strip || !cell) return;
    const left = cell.offsetLeft - (strip.clientWidth - cell.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [selected]);

  /** 칸을 눌렀다 — 그 묶음 머리를 기준선에 맞춘다 */
  function go(key: string) {
    const section = sectionRefs.current.get(key);
    if (!section) return;
    setSelected(key);
    lock.current = { key, until: Date.now() + LOCK_MS };
    const top = window.scrollY + section.getBoundingClientRect().top - lineY();
    window.scrollTo({ top, behavior: "smooth" });
  }

  /** 묶음의 ref — 키마다 하나 */
  function sectionRef(key: string) {
    return (el: HTMLElement | null) => {
      if (el) sectionRefs.current.set(key, el);
      else sectionRefs.current.delete(key);
    };
  }

  return { selected, go, stripRef, sectionRef };
}
