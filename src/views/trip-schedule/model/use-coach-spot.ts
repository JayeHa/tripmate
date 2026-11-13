"use client";

import { useLayoutEffect, useMemo, useState } from "react";

/** 말풍선이 가리키는 요소의 화면 자리(px) */
export type CoachSpot = {
  top: number;
  left: number;
  width: number;
  height: number;
  /** 요소의 모서리 — 테두리를 같은 모양으로 두른다 */
  radius: string;
  /** 요소의 `data-coach` 값 */
  kind: string;
};

/** 말풍선 층(닫기 칸 · 말풍선)에 다는 속성 — 요소가 덮였는지 볼 때 이 층은 건너뛴다 */
export const COACH_LAYER = "data-coach-layer";

/**
 * 요소가 지금 눈에 보이는지 — 가운데 점에서 맨 위에 있는 것이 그 요소(의 안쪽)일 때만.
 * 화면 밖 · 스크롤 칸에 잘림 · 숨김 · 다른 것(붙는 줄 · 하단 탭 · 편집 화면 · 열린 창)에 덮임이면 false
 */
function shown(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const top = document
    .elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    .find((hit) => !hit.closest(`[${COACH_LAYER}]`));
  return !!top && el.contains(top);
}

/** 선택자에 맞는 요소 중 지금 보이는 첫 번째의 자리를 글자로 — 같은 자리면 같은 글자라 다시 그리지 않는다. 없으면 "" */
function measure(selector: string): string {
  const el = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(shown);
  if (!el) return "";
  const rect = el.getBoundingClientRect();
  const spot: CoachSpot = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    radius: getComputedStyle(el).borderRadius,
    kind: el.dataset.coach ?? "",
  };
  return JSON.stringify(spot);
}

/**
 * 말풍선이 가리킬 요소(CSS 선택자) 중 지금 눈에 보이는 첫 번째의 화면 자리. 보이는 것이 없으면 null — 말풍선을 그리지 않는다.
 * 그 버튼이 화면에 들어온 순간에 뜨고, 스크롤로 벗어나면 사라졌다가 다시 보이면 뜬다(본 것으로 치지 않는다).
 * 렌더할 때마다 다시 잰다 — 요소가 나중에 그려지거나(카드를 펼침 · 다녀감을 늦게 읽음) 밀려도 따라간다.
 * 스크롤(안쪽 칸 포함) · 창 크기가 바뀔 때 · 열린 창이 body 에서 빠질 때도 잰다
 */
export function useCoachSpot(selector: string): CoachSpot | null {
  const [measured, setMeasured] = useState("");
  useLayoutEffect(() => {
    /** 지금 자리로 맞춘다 */
    function update() {
      setMeasured(measure(selector));
    }
    update();
    // 안쪽 스크롤 칸(PC 목록)의 스크롤은 위로 올라오지 않아 capture 로 듣는다
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    // 창(body 에 붙는 포털)이 닫히면 렌더할 때는 아직 사라지는 중이라 덮여 있다 — 다 사라져 body 에서 빠질 때 다시 잰다
    const portals = new MutationObserver(update);
    portals.observe(document.body, { childList: true });
    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
      portals.disconnect();
    };
  });
  return useMemo(() => (measured ? (JSON.parse(measured) as CoachSpot) : null), [measured]);
}
