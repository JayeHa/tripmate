import { flushSync } from "react-dom";

import { pickAnchor } from "../lib/focus";

/** 보던 자리를 재고 되돌리는 데 쓰는 것 — 레이아웃마다 다르다(모바일은 페이지, PC 는 목록 칸이 스크롤된다) */
export type ScrollPlace = {
  /** 날짜 머리(`data-day-head`) · 장소 줄(`id="item-…"`)을 감싼 요소 */
  list: () => HTMLElement | null;
  /** 목록이 보이기 시작하는 화면 y(모바일 붙은 날짜 칩 아래 · PC 목록 칸 위) */
  line: () => number;
  /** 스크롤을 그만큼 바로 옮긴다(아래로 +) */
  scrollBy: (dy: number) => void;
};

/** 보던 자리의 후보 — 날짜 머리와 장소 줄(문서 순서) */
const ANCHORS = '[data-day-head], [id^="item-"]';

/**
 * 목록 내용을 바꾸되(change) 보던 자리를 지킨다 — 기준선에 걸친(없으면 그 아래 첫) 날짜 머리 · 장소가
 * 바꾼 뒤에도 같은 높이에 오게 스크롤을 옮긴다. 「계획 | 기록」 은 카드 안 · 날짜 머리의 높이가 달라서, 그대로 두면 보던 장소가 밀려난다.
 * 바뀐 높이를 바로 재려고 change 를 flushSync 로 그린다. Chrome 은 스크롤 앵커링이 먼저 맞춰 주기도 하지만 Safari 에는 없다 —
 * 어느 쪽이든 남은 차이만 옮긴다. 후보가 없거나 바꾼 뒤 사라졌으면 스크롤은 그대로 둔다
 */
export function keepPlace(place: ScrollPlace, change: () => void) {
  const marks = Array.from(place.list()?.querySelectorAll<HTMLElement>(ANCHORS) ?? []);
  const at = pickAnchor(
    marks.map((el) => el.getBoundingClientRect()),
    place.line(),
  );
  const anchor = at === null ? null : marks[at];
  const before = anchor?.getBoundingClientRect().top ?? 0;
  flushSync(change);
  if (!anchor?.isConnected) return;
  const moved = anchor.getBoundingClientRect().top - before;
  if (moved !== 0) place.scrollBy(moved);
}
