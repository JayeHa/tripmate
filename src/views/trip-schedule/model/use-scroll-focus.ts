import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { pickFocus } from "../lib/focus";

/** 핀을 눌러 스크롤하는 동안 스크롤이 이만큼 멈추면 끝난 것으로 본다(smooth 스크롤은 매 프레임 scroll 이벤트를 낸다) */
const HOLD_MS = 150;

type ScrollFocusOptions = {
  /** 스크롤을 듣는 칸. 없으면 window — 모바일은 페이지가 스크롤된다 */
  scroller?: RefObject<HTMLElement | null>;
  /** 강조 후보 행(`data-focus-id`)을 찾을 범위 */
  list: RefObject<HTMLElement | null>;
  /** 기준선의 화면 y. 스크롤할 때마다 부른다 — 모바일은 지도를 접고 펴면 바뀐다 */
  line: () => number;
  /** false 면 강조하지 않고 스크롤도 무시한다(모바일 지도가 접혔을 때) */
  enabled: boolean;
  /** 바뀌면 강조를 지운다(날짜 변경) */
  resetKey: unknown;
};

type FocusState = { key: unknown; id: string | null };

/**
 * 스크롤 연동 강조 — 기준선을 지난 마지막 장소를 「지금 보고 있는 장소」로 고른다.
 * 스크롤 중에만 다시 고른다(프레임당 한 번). 날짜를 바꾸면 스크롤할 때까지 강조가 없다.
 *
 * `focusOn(id)` 은 핀을 눌렀을 때 쓴다. 그 장소를 바로 강조하고, 뒤따르는 smooth 스크롤이 끝날 때까지
 * 다시 고르지 않는다 — 그러지 않으면 지나가는 행마다 강조와 지도가 따라 움직인다. 끝나면 한 번 다시 고른다.
 */
export function useScrollFocus({ scroller, list, line, enabled, resetKey }: ScrollFocusOptions) {
  const [state, setState] = useState<FocusState>({ key: resetKey, id: null });
  const latest = useRef({ line, enabled, resetKey });
  useLayoutEffect(() => {
    latest.current = { line, enabled, resetKey };
  });
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scan = useCallback(() => {
    const root = list.current;
    const { line: lineOf, enabled: on, resetKey: key } = latest.current;
    if (!on || !root) return;
    const candidates = Array.from(root.querySelectorAll<HTMLElement>("[data-focus-id]"), (el) => ({
      id: el.dataset.focusId ?? "",
      top: el.getBoundingClientRect().top,
    }));
    const id = pickFocus(candidates, lineOf());
    setState((s) => (s.key === key && s.id === id ? s : { key, id }));
  }, [list]);

  /** 스크롤이 HOLD_MS 동안 멈출 때까지 다시 고르지 않다가, 멈추면 한 번 고른다 */
  const holdScan = useCallback(() => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      hold.current = null;
      scan();
    }, HOLD_MS);
  }, [scan]);

  useEffect(() => {
    const target = scroller?.current ?? window;
    let frame = 0;
    const onScroll = () => {
      if (hold.current) {
        holdScan();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      if (hold.current) clearTimeout(hold.current);
      hold.current = null;
    };
  }, [scroller, scan, holdScan]);

  /** 핀으로 고른 장소를 바로 강조한다. 스크롤은 부른 쪽이 한다 */
  const focusOn = useCallback(
    (id: string) => {
      setState({ key: latest.current.resetKey, id });
      holdScan();
    },
    [holdScan],
  );

  return { focusId: enabled && state.key === resetKey ? state.id : null, focusOn };
}
