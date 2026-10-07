"use client";

import { useEffect, useRef, useState } from "react";

/** 키를 받지 않는 곳 — 입력칸 · 열린 메뉴 · 창 안에서는 ↑↓ · Esc 가 그쪽 동작이다 */
const OWN_KEYS = "input, textarea, select, [role=menu], [role=listbox], [role=dialog]";

/**
 * PC 가계부 표에서 고른 비용 — 오른쪽 패널이 그 비용의 상세가 된다. ↑↓ 는 보이는 줄 순서(`order`, 필터 반영)대로 옮기고
 * 옮긴 줄이 표에서 보이게 스크롤한다(줄에 `data-expense-id`). Esc 는 닫는다(요약으로).
 * `paused`(비용 창이 열림) 동안이나 입력칸 · 메뉴에 포커스가 있으면 키를 받지 않는다.
 * 고른 비용이 필터에 걸리거나 지워져 `order` 에 없으면 선택을 비운다 — 가려 두기만 하면 필터를 풀 때 누르지 않은 상세가 다시 열린다
 */
export function useRowSelection(order: string[], paused: boolean) {
  const [selected, setSelected] = useState<string | null>(null);
  // 렌더 중에 비운다(이펙트를 거치면 한 번 더 그린다)
  if (selected !== null && !order.includes(selected)) setSelected(null);
  // 키 처리는 한 번만 구독한다 — 렌더마다 바뀌는 값은 ref 로 본다
  const latest = useRef({ order, selected, paused });
  useEffect(() => {
    latest.current = { order, selected, paused };
  });

  useEffect(() => {
    /** ↑↓ 로 이웃 줄, Esc 로 닫기 */
    function onKey(ev: KeyboardEvent) {
      const { order: rows, selected: current, paused: off } = latest.current;
      if (!current || off || ev.defaultPrevented) return;
      if (ev.target instanceof Element && ev.target.closest(OWN_KEYS)) return;
      if (ev.key === "Escape") {
        setSelected(null);
        return;
      }
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
      const at = rows.indexOf(current);
      const next = at < 0 ? undefined : rows[at + (ev.key === "ArrowDown" ? 1 : -1)];
      if (!next) return;
      ev.preventDefault();
      setSelected(next);
      document
        .querySelector(`[data-expense-id="${next}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    selected,
    select: setSelected,
    clear: () => setSelected(null),
  };
}
