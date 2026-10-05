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
};

/**
 * 이어서 보기의 날짜 이동 두 가지 — 처음 그려졌을 때 `?day` 날짜로 바로(애니메이션 없이), 뷰가 요청하면 그 날로(부드럽게).
 * 첫날은 이미 맨 위라 처음 이동을 하지 않는다.
 * 마운트할 때 이미 있던 요청은 따르지 않는다 — 요청은 뷰에 남아 있어서, 화면 폭이 바뀌어 다른 레이아웃이
 * 새로 마운트되면 지난 요청으로 다시 스크롤하게 된다
 */
export function useDayJumps({ scrollToDay, day, ready, jump }: DayJumpsOptions) {
  const opened = useRef(false);
  useEffect(() => {
    if (!ready || opened.current) return;
    opened.current = day === 0 || scrollToDay(day, false);
  }, [ready, day, scrollToDay]);

  const handled = useRef(jump);
  useEffect(() => {
    if (!jump || jump === handled.current) return;
    handled.current = jump;
    scrollToDay(jump.day);
  }, [jump, scrollToDay]);
}
