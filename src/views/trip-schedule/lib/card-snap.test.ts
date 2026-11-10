import { describe, expect, it } from "vitest";

import { settledCardIndex } from "./card-snap";

describe("settledCardIndex", () => {
  const snaps = [0, 246, 492, 738];

  it("멈춘 자리에 가장 가까운 카드", () => {
    expect(settledCardIndex(snaps, 0, 650)).toBe(0);
    expect(settledCardIndex(snaps, 250, 650)).toBe(1);
    expect(settledCardIndex(snaps, 480, 650)).toBe(2);
  });

  it("끝까지 넘겼으면 왼쪽에 오지 못한 마지막 카드", () => {
    // 650 은 셋째(492)에 더 가깝지만 끝이라 넷째
    expect(settledCardIndex(snaps, 650, 650)).toBe(3);
  });

  it("카드가 없으면 -1", () => {
    expect(settledCardIndex([], 0, 0)).toBe(-1);
  });
});
