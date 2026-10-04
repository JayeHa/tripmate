import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { pickFocus } from "../lib/focus";

/** 핀으로 고른 행을 기준선보다 이만큼 위로 스크롤한다. 기준선을 지난 마지막 행이 그 행이 되게 */
const PIN_SCROLL_MARGIN = 12;

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

/** 스크롤을 듣고 움직일 대상. 칸을 넘기지 않았으면 window */
function scrollTargetOf(scroller: RefObject<HTMLElement | null> | undefined): HTMLElement | Window {
  return scroller?.current ?? window;
}

type FocusState = { key: unknown; id: string | null };

/**
 * 스크롤 연동 강조 — 기준선을 지난 마지막 장소를 「지금 보고 있는 장소」로 고른다.
 * 스크롤 중에만 다시 고른다(프레임당 한 번). 날짜를 바꾸거나 다시 켜지면 스크롤할 때까지 강조가 없다.
 *
 * `focusOn(id)` 은 핀을 눌렀을 때 쓴다. 그 장소를 바로 강조하고 그 행을 기준선 바로 위로 smooth 스크롤한다.
 * 스크롤이 끝날 때까지 다시 고르지 않는다 — 그러지 않으면 지나가는 행마다 강조와 지도가 따라 움직인다.
 * 끝나면 한 번 다시 고른다. 행을 기준선 위에 두므로 다시 골라도 같은 행이다(목록 끝 여백이 충분할 때).
 */
export function useScrollFocus({ scroller, list, line, enabled, resetKey }: ScrollFocusOptions) {
  const [state, setState] = useState<FocusState>({ key: resetKey, id: null });
  // 꺼졌다 켜지면(모바일 지도 접기 → 펴기) 옛 강조를 지운다. 접은 채 스크롤했으면 그 행은 이미 지나갔다.
  // 날짜를 바꿨을 때처럼 다음 스크롤에서 다시 고른다. 렌더 중에 고쳐서 옛 강조가 한 번도 그려지지 않는다
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    setState((s) => (s.id === null ? s : { ...s, id: null }));
  }
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
    const target = scrollTargetOf(scroller);
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

  /**
   * 핀으로 고른 장소를 바로 강조하고, 그 행을 기준선보다 조금 위로 스크롤한다.
   * scrollIntoView 는 쓰지 않는다 — sticky 를 몰라서 모바일에서는 행이 지도 밑에 가려진다.
   * 기준선은 누를 때마다 다시 잰다(지도를 접으면 바뀐다).
   */
  const focusOn = useCallback(
    (id: string) => {
      setState({ key: latest.current.resetKey, id });
      holdScan();
      const row = list.current?.querySelector(`[data-focus-id="${id}"]`);
      if (!row) return;
      const by = row.getBoundingClientRect().top - (latest.current.line() - PIN_SCROLL_MARGIN);
      scrollTargetOf(scroller).scrollBy({ top: by, behavior: "smooth" });
    },
    [holdScan, list, scroller],
  );

  return { focusId: enabled && state.key === resetKey ? state.id : null, focusOn };
}
