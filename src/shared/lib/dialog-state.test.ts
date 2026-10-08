import { describe, expect, it } from "vitest";

import { nextHeld, nextOpenCount, type OpenCount } from "./dialog-state";

/** 열림 상태를 차례로 넣어 본 count 들 */
function counts(opens: boolean[]): number[] {
  let state: OpenCount = { open: false, count: 0 };
  return opens.map((open) => {
    state = nextOpenCount(state, open);
    return state.count;
  });
}

describe("nextHeld", () => {
  it("열려 있으면 받은 값, 닫히면 마지막 값을 둔다", () => {
    expect(nextHeld("a", true, "b")).toBe("b");
    expect(nextHeld("b", false, null)).toBe("b");
  });

  it("null 도 열린 동안의 값이면 따라간다 — 「나부터」 처럼 null 이 뜻이 있는 창", () => {
    expect(nextHeld<string | null>("a", true, null)).toBeNull();
  });
});

describe("nextOpenCount", () => {
  it("닫힘 → 열림마다 1 늘고, 닫히는 동안은 그대로다", () => {
    expect(counts([true, true, false, false, true])).toEqual([1, 1, 1, 1, 2]);
  });

  it("처음부터 열려 있던 상태에서 시작해도 다시 열 때 늘어난다", () => {
    const start: OpenCount = { open: true, count: 0 };
    const closed = nextOpenCount(start, false);
    expect(nextOpenCount(closed, true).count).toBe(1);
  });
});
