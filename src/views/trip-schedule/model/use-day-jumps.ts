import { useEffect, useRef } from "react";

import type { DayJump } from "../ui/schedule-layout";

type DayJumpsOptions = {
  /** 그 날짜로 스크롤한다(useVisibleDay) — 머리를 못 찾으면 false */
  scrollToDay: (day: number, smooth?: boolean) => boolean;
  /** 처음 열 때의 `?day` */
  day: number;
  /** 날짜 묶음을 다 그렸는지(일정 · 여행을 읽은 뒤) */
  ready: boolean;
  /** 뷰가 보내는 「그 날로 스크롤」 요청 */
  jump: DayJump | null;
  /**
   * false 면 스크롤하지 않는다(PC 하루씩 보기 — 그 날만 그려 맨 위가 곧 그 날이다). 그동안 온 요청은 처리한 것으로 보고,
   * 처음 이동도 끝난 것으로 본다 — 이어서로 돌아올 때의 이동은 보기 전환이 맡는다
   */
  enabled?: boolean;
};

/**
 * 이어서 보기의 날짜 이동 두 가지 — 처음 그려졌을 때 `?day` 날짜로 바로(애니메이션 없이), 뷰가 요청하면 그 날로(부드럽게).
 * 첫날은 이미 맨 위라 처음 이동을 하지 않는다.
 * 마운트할 때 이미 있던 요청은 따르지 않는다 — 요청은 뷰에 남아 있어서, 화면 폭이 바뀌어 다른 레이아웃이
 * 새로 마운트되면 지난 요청으로 다시 스크롤하게 된다
 */
export function useDayJumps({ scrollToDay, day, ready, jump, enabled = true }: DayJumpsOptions) {
  const opened = useRef(false);
  useEffect(() => {
    if (!ready || opened.current) return;
    opened.current = !enabled || day === 0 || scrollToDay(day, false);
  }, [ready, day, enabled, scrollToDay]);

  const handled = useRef(jump);
  useEffect(() => {
    if (!jump || jump === handled.current) return;
    handled.current = jump;
    if (enabled) scrollToDay(jump.day);
  }, [jump, enabled, scrollToDay]);
}
