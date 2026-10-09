import { describe, expect, it } from "vitest";

import { diffBars } from "./diff-bar";

describe("diffBars", () => {
  it("가장 큰 차액이 반폭, 받을 돈은 가운데에서 오른쪽 · 보낼 돈은 왼쪽", () => {
    const [a, b, c] = diffBars([200, -100, 0]);
    expect(a).toEqual({ side: "receive", net: 200, left: 50, width: 50 });
    expect(b).toEqual({ side: "send", net: -100, left: 25, width: 25 });
    expect(c).toEqual({ side: "none", net: 0, left: 50, width: 0 });
  });

  it("1원 아래 끝수는 정산 없음, 아주 작은 차액도 최소 길이", () => {
    const [a, b] = diffBars([100000, 0.4]);
    expect(a.width).toBe(50);
    expect(b.side).toBe("none");
    expect(diffBars([100000, 5])[1].width).toBe(0.6);
  });

  it("모두 0 이면 막대 없음", () => {
    expect(diffBars([0])).toEqual([{ side: "none", net: 0, left: 50, width: 0 }]);
  });
});
