"use client";

import { useState } from "react";

import type { DayMode } from "@/entities/schedule-item";

import { closedSeen, currentTip, TIP_ANCHOR, type TipId, type TipSeen } from "../lib/coach";

/** 말풍선마다 본 적이 있는지 — 기기별로 기억한다 */
const KEYS: Record<TipId, string> = {
  mode: "tm-tip-mode-toggle",
  map: "tm-tip-route-map",
  visit: "tm-tip-visit-toggle",
};
const TIPS = Object.keys(KEYS) as TipId[];

/** 저장된 본 것. 사생활 모드 · 막힌 저장소에서는 안 본 것으로 */
function readSeen(): TipSeen {
  const has = (tip: TipId) => {
    try {
      return localStorage.getItem(KEYS[tip]) !== null;
    } catch {
      return false;
    }
  };
  return { mode: has("mode"), map: has("map"), visit: has("visit") };
}

/** 본 것으로 저장한다. 막혀 있으면 이번 화면에서만 기억한다 */
function writeSeen(tip: TipId) {
  try {
    localStorage.setItem(KEYS[tip], "1");
  } catch {
    // 저장할 수 없으면 이 화면에서만 기억한다
  }
}

/** 지금 띄울 말풍선 — CoachTip 이 그대로 받는다 */
export type RouteCoach = {
  tip: TipId;
  mobile: boolean;
  /** 가리킬 요소의 CSS 선택자. 그 요소가 화면에 보이지 않으면 말풍선도 그리지 않는다 */
  anchor: string;
  /** 「다음」 · 「알겠어요」 */
  onNext: () => void;
  /** 말풍선 밖을 눌렀다 */
  onClose: () => void;
};

type RouteCoachInput = {
  mobile: boolean;
  /** 화면 폭을 알고 일정이 비어 있지 않다 — 아니면 띄우지 않는다 */
  ready: boolean;
  mode: DayMode;
  /** 펼친 카드 */
  openId: string | null;
};

/**
 * 일정 화면의 첫 사용 말풍선 — 그 버튼이 처음 보일 때 한 번씩. 한 번 본(「다음」 · 「알겠어요」 · 바깥 누름) 말풍선은 다시 뜨지 않는다.
 * 들어오면 「계획 | 기록」 → 「🗺 동선 보기」(모바일만), 다녀왔어요 · 패스는 그 버튼이 화면에 보일 때(기록 모드의 큰 버튼 · 펼친 카드의 토글 줄).
 * 바깥을 눌러 닫으면 이어지는 말풍선을 바로 띄우지 않는다 — 보기를 바꾸거나 다른 카드를 펼칠 때까지.
 * localStorage 를 첫 렌더에서 읽는다 — 일정 목록은 화면 폭을 알고 일정을 읽은 뒤(클라이언트)에만 마운트돼서 하이드레이션과 어긋나지 않는다
 */
export function useRouteCoach({ mobile, ready, mode, openId }: RouteCoachInput): RouteCoach | null {
  const [seen, setSeen] = useState(readSeen);
  // 바깥을 눌러 닫았을 때의 보기 · 펼친 카드 — 그대로인 동안은 다녀왔어요 · 패스를 이어서 띄우지 않는다
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const tip = ready ? currentTip(seen, mobile) : null;
  const scene = `${mode}:${openId ?? ""}`;
  if (!tip || (tip === "visit" && closedAt === scene)) return null;

  /** 본 것을 바꾸고 새로 본 것을 저장한다 */
  function see(next: TipSeen) {
    TIPS.filter((t) => next[t] && !seen[t]).forEach(writeSeen);
    setSeen(next);
  }

  return {
    tip,
    mobile,
    anchor: TIP_ANCHOR[tip],
    onNext: () => see({ ...seen, [tip]: true }),
    onClose: () => {
      see(closedSeen(seen, tip, mobile));
      setClosedAt(scene);
    },
  };
}
