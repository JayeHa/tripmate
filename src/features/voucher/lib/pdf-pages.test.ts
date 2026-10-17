import { describe, expect, it } from "vitest";

import { PAGE_MAX_SIDE, PAGE_WIDTH, pageScale } from "./pdf-pages";

describe("pageScale", () => {
  it("폭을 1600 으로 맞추고, 아주 긴 페이지는 긴 변 4096 에서 멈춘다", () => {
    // A4(595 × 842pt) → 1600 × 2264
    expect(Math.round(595 * pageScale(595, 842))).toBe(PAGE_WIDTH);
    // 영수증처럼 긴 페이지(595 × 5000pt) → 높이 4096
    expect(Math.round(5000 * pageScale(595, 5000))).toBe(PAGE_MAX_SIDE);
    // 가로 페이지(842 × 595pt) → 폭 1600
    expect(Math.round(842 * pageScale(842, 595))).toBe(PAGE_WIDTH);
  });
});
