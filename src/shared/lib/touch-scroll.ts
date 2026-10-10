/** 한 축의 스크롤 위치 — 지금 위치 · 내용 길이 · 보이는 길이 */
export type ScrollAxis = { pos: number; size: number; view: number };

/**
 * 손가락이 move 만큼 움직였을 때 이 축이 더 스크롤되는지. move > 0(아래 · 오른쪽으로 끌기)은 처음 쪽으로,
 * move < 0 은 끝 쪽으로 간다. 소수점 위치(확대 · 기기 픽셀) 때문에 끝은 1px 여유를 둔다
 */
export function canScrollBy({ pos, size, view }: ScrollAxis, move: number): boolean {
  if (move === 0 || size <= view + 1) return false;
  return move > 0 ? pos > 0 : pos + view < size - 1;
}

/** overflow 값이 사용자가 스크롤할 수 있는 칸인지(hidden · clip 은 코드로만 움직인다) */
function isScrollable(overflow: string): boolean {
  return overflow === "auto" || overflow === "scroll";
}

/** 요소의 한 축 스크롤 위치 */
function axisOf(el: Element, horizontal: boolean): ScrollAxis {
  return horizontal
    ? { pos: el.scrollLeft, size: el.scrollWidth, view: el.clientWidth }
    : { pos: el.scrollTop, size: el.scrollHeight, view: el.clientHeight };
}

/** 요소에서 위로 올라가며, 한 축으로 move 만큼 움직였을 때 스크롤될 칸이 있는지 */
function hasScrollerOnAxis(target: Element | null, horizontal: boolean, move: number): boolean {
  if (move === 0) return false;
  let el = target;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = getComputedStyle(el);
    const overflow = horizontal ? style.overflowX : style.overflowY;
    if (isScrollable(overflow) && canScrollBy(axisOf(el, horizontal), move)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * 손가락 아래 요소에서 위로 올라가며, 이 이동(dx · dy)으로 스크롤될 칸이 있는지. 두 축을 따로 보고 하나라도 있으면 true —
 * 손짓 처음 1~2px 은 세로로 밀어도 dx 가 더 클 수 있어서, 큰 쪽 축 하나만 보면 세로 목록이 막힌다.
 * 페이지 자체(html · body)는 보지 않는다 — 창이 열려 있는 동안 막으려는 대상이 그것이다
 */
export function hasScrollerFor(target: EventTarget | null, dx: number, dy: number): boolean {
  const el = target instanceof Element ? target : null;
  return hasScrollerOnAxis(el, false, dy) || hasScrollerOnAxis(el, true, dx);
}
