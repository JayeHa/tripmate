import { describe, expect, it } from "vitest";

import { canScrollBy } from "./touch-scroll";

describe("canScrollBy", () => {
  const middle = { pos: 100, size: 1000, view: 400 };

  it("중간이면 양쪽 다 스크롤된다", () => {
    expect(canScrollBy(middle, 10)).toBe(true);
    expect(canScrollBy(middle, -10)).toBe(true);
  });

  it("맨 위에서 아래로 끌면(처음 쪽) 안 되고, 위로 끌면 된다", () => {
    const top = { ...middle, pos: 0 };
    expect(canScrollBy(top, 10)).toBe(false);
    expect(canScrollBy(top, -10)).toBe(true);
  });

  it("맨 끝(소수점 여유 1px 안)에서 위로 끌면 안 된다", () => {
    expect(canScrollBy({ ...middle, pos: 599.5 }, -10)).toBe(false);
    expect(canScrollBy({ ...middle, pos: 599.5 }, 10)).toBe(true);
  });

  it("내용이 칸보다 짧거나(1px 이하 넘침 포함) 움직임이 없으면 안 된다", () => {
    expect(canScrollBy({ pos: 0, size: 400, view: 400 }, -10)).toBe(false);
    expect(canScrollBy({ pos: 0, size: 400.5, view: 400 }, -10)).toBe(false);
    expect(canScrollBy(middle, 0)).toBe(false);
  });
});
