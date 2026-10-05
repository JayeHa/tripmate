"use client";

import { useState } from "react";

/** PC 일정 목록 보기 — 이어서(모든 날짜) · 하루씩(고른 날짜만) */
export type DayViewMode = "all" | "one";

/** 기기별로 기억한다 — 일행과 나누지 않는다 */
const MODE_KEY = "tm-pc-day-view";
/** 처음 하루씩으로 바꿀 때의 말풍선을 닫았는지 */
const TIP_KEY = "tm-pc-day-view-tip";

/** 바꾼 직후 띄우는 안내 토스트 */
const GUIDE: Record<DayViewMode, { text: string; detail: string }> = {
  one: {
    text: "하루씩 보기",
    detail: "선택한 날짜의 일정만 보여요. 다른 날은 왼쪽에서 골라 주세요",
  },
  all: { text: "이어서 보기", detail: "모든 날짜를 한 번에 스크롤해서 봐요" },
};

/** 저장된 값. 사생활 모드 · 막힌 저장소에서는 null */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 저장한다. 막혀 있으면 이번 화면에서만 기억한다 */
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장할 수 없으면 이 화면에서만 기억한다
  }
}

/**
 * PC 일정의 「이어서 / 하루씩」 설정과 바꾼 직후의 안내.
 * 바꾸면 안내 토스트(2.6s)를 띄운다. 처음 하루씩으로 바꿀 때만 토스트 대신 토글 아래 말풍선을 띄우고, 「알겠어요」 를 누르면 다시 띄우지 않는다.
 * 토스트는 화면의 것 하나로 띄운다(onGuide) — 따로 그리면 다른 알림과 겹친다.
 * localStorage 를 첫 렌더에서 읽는다 — PC 레이아웃은 화면 폭을 안 뒤(클라이언트)에만 마운트돼서 하이드레이션과 어긋나지 않는다
 */
export function usePcDayView(onGuide: (text: string, detail: string) => void) {
  const [mode, setModeState] = useState<DayViewMode>(() =>
    read(MODE_KEY) === "one" ? "one" : "all",
  );
  const [tipSeen, setTipSeen] = useState(() => read(TIP_KEY) !== null);
  const [tip, setTip] = useState(false);

  /** 보기를 바꾸고 저장한다. 같은 보기면 아무것도 하지 않는다 */
  function setMode(next: DayViewMode) {
    if (next === mode) return;
    setModeState(next);
    write(MODE_KEY, next);
    const firstOne = next === "one" && !tipSeen;
    setTip(firstOne);
    if (!firstOne) onGuide(GUIDE[next].text, GUIDE[next].detail);
  }

  return {
    mode,
    setMode,
    /** 하루씩 보기에서만 보인다 — 이어서로 돌아가면 닫힌다 */
    tip: tip && mode === "one",
    dismissTip: () => {
      write(TIP_KEY, "1");
      setTipSeen(true);
      setTip(false);
    },
  };
}
