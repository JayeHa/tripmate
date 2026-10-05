import { type RefObject, useEffect, useRef } from "react";

type DayViewScrollOptions = {
  /** 하루씩 보기인지 */
  one: boolean;
  /** 보고 있는 날 */
  day: number;
  /** 목록 스크롤 칸 */
  list: RefObject<HTMLElement | null>;
  /** 그 날짜로 스크롤한다(useVisibleDay) */
  scrollToDay: (day: number, smooth?: boolean) => boolean;
};

/**
 * 「이어서 / 하루씩」 을 오갈 때의 목록 스크롤. 하루씩에서는 날짜를 바꾸거나 하루씩으로 들어오면 목록 맨 위로,
 * 이어서로 돌아오면 보던 날짜로 바로 간다(모든 날짜가 다시 그려져 맨 위는 첫날이다)
 */
export function useDayViewScroll({ one, day, list, scrollToDay }: DayViewScrollOptions) {
  useEffect(() => {
    if (one) list.current?.scrollTo({ top: 0 });
  }, [one, day, list]);

  const wasOne = useRef(one);
  useEffect(() => {
    if (wasOne.current && !one) scrollToDay(day, false);
    wasOne.current = one;
  }, [one, day, scrollToDay]);
}
