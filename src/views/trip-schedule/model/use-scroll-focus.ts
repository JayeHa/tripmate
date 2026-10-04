import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { pickFocus, pinScrollTarget } from "../lib/focus";

/** 핀으로 고른 행을 기준선보다 이만큼 위로 스크롤한다. 기준선을 지난 마지막 행이 그 행이 되게 */
const PIN_SCROLL_MARGIN = 12;

/** 핀을 눌러 스크롤하는 동안 스크롤이 이만큼 멈추면 끝난 것으로 본다(smooth 스크롤은 매 프레임 scroll 이벤트를 낸다) */
const HOLD_MS = 150;

type ScrollFocusOptions = {
  /** 스크롤을 듣는 칸. 없으면 window — 모바일은 페이지가 스크롤된다 */
  scroller?: RefObject<HTMLElement | null>;
  /**
   * 강조 후보 행(`data-focus-id`)을 감싼 요소. 높이가 내용을 따라 변해야 한다 — 이 요소의 크기 변화로
   * 스크롤 없이 행이 움직인 것을 안다. 높이가 고정된 스크롤 칸 자체를 넘기면 그 변화를 못 본다
   */
  list: RefObject<HTMLElement | null>;
  /**
   * 스크롤 위치 → 기준선의 화면 y. 고를 때마다 부른다 — 모바일은 지도를 접고 펴면 바뀐다.
   * 스크롤에 따라 움직여도 되지만, 스크롤이 내려갈수록 같거나 아래로만 가야 한다(핀 스크롤 계산의 전제)
   */
  line: (scrollTop: number) => number;
  /** false 면 강조하지 않고 스크롤도 무시한다(모바일 지도가 접혔을 때) */
  enabled: boolean;
  /** 바뀌면 강조를 지운다(날짜 변경) */
  resetKey: unknown;
};

/** 스크롤을 듣고 움직일 대상. 칸을 넘기지 않았으면 window */
function scrollTargetOf(scroller: RefObject<HTMLElement | null> | undefined): HTMLElement | Window {
  return scroller?.current ?? window;
}

/** 지금 스크롤 위치와 최대 스크롤 위치 */
function scrollMetricsOf(target: HTMLElement | Window) {
  const el = target instanceof Window ? document.documentElement : target;
  return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight };
}

type FocusState = { key: unknown; id: string | null };

/**
 * 스크롤 연동 강조 — 기준선을 지난 마지막 장소를 「지금 보고 있는 장소」로 고른다.
 * 스크롤할 때(프레임당 한 번), 강조가 있으면 행 위치가 바뀔 때도 다시 고른다.
 * 날짜를 바꾸거나 다시 켜지면 스크롤할 때까지 강조가 없다.
 *
 * `focusOn(id)` 은 핀을 눌렀을 때 쓴다. 그 장소를 바로 강조하고 그 행을 기준선 바로 위로 smooth 스크롤한다.
 * 스크롤이 끝날 때까지 다시 고르지 않는다 — 그러지 않으면 지나가는 행마다 강조와 지도가 따라 움직인다.
 * 끝나면 한 번 다시 고른다. 행을 기준선 바로 위에 두므로 다시 골라도 같은 행이다(목록 끝 여백이 충분할 때).
 * 기준선이 스크롤에 따라 움직이면 스크롤 뒤의 기준선에 맞춘다(pinScrollTarget).
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
  const focusId = enabled && state.key === resetKey ? state.id : null;
  // 콜백 · 리스너가 다시 만들어지지 않게 최신 값은 ref 로 읽는다
  const latest = useRef({ list, scroller, line, enabled, resetKey, focused: focusId !== null });
  useLayoutEffect(() => {
    latest.current = { list, scroller, line, enabled, resetKey, focused: focusId !== null };
  });
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scan = useCallback(() => {
    const {
      list: listRef,
      scroller: scrollerRef,
      line: lineOf,
      enabled: on,
      resetKey: key,
    } = latest.current;
    const root = listRef.current;
    if (!on || !root) return;
    const line = lineOf(scrollMetricsOf(scrollTargetOf(scrollerRef)).top);
    const candidates = Array.from(root.querySelectorAll<HTMLElement>("[data-focus-id]"), (el) => ({
      id: el.dataset.focusId ?? "",
      top: el.getBoundingClientRect().top,
    }));
    const id = pickFocus(candidates, line);
    setState((s) => (s.key === key && s.id === id ? s : { key, id }));
  }, []);

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
    // 스크롤 없이 행이 움직일 때(메모 펼치기 · 추가 · 삭제 · day 헤더 등장 · 회전). 감싼 요소의 크기로 안다.
    // 강조가 있을 때만 다시 고른다 — 날짜를 막 바꾼 뒤엔 지도가 핀 전체를 보이고 있어 첫 장소로 옮기지 않는다
    const onLayout = () => {
      if (hold.current || !latest.current.focused) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };
    const observer = new ResizeObserver(onLayout);
    if (list.current) observer.observe(list.current);
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onLayout);
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onLayout);
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (hold.current) clearTimeout(hold.current);
      hold.current = null;
    };
  }, [scroller, list, scan, holdScan]);

  /**
   * 핀으로 고른 장소를 바로 강조하고, 그 행을 기준선보다 조금 위로 스크롤한다.
   * scrollIntoView 는 쓰지 않는다 — sticky 를 몰라서 모바일에서는 행이 지도 밑에 가려진다.
   * 기준선은 누를 때마다 다시 잰다(지도를 접으면 바뀐다).
   */
  const focusOn = useCallback(
    (id: string) => {
      setState({ key: latest.current.resetKey, id });
      holdScan();
      const { list: listRef, scroller: scrollerRef, line: lineOf } = latest.current;
      const row = listRef.current?.querySelector(`[data-focus-id="${id}"]`);
      if (!row) return;
      const target = scrollTargetOf(scrollerRef);
      const { top, max } = scrollMetricsOf(target);
      const to = pinScrollTarget(
        row.getBoundingClientRect().top,
        top,
        max,
        lineOf,
        PIN_SCROLL_MARGIN,
      );
      target.scrollTo({ top: to, behavior: "smooth" });
    },
    [holdScan],
  );

  return { focusId, focusOn };
}
