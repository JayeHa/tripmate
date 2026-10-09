import { describe, expect, it } from "vitest";

import { sizeByLength } from "./size-by-length";

const STEPS = [
  [10, "big"],
  [13, "mid"],
] as const;

describe("sizeByLength", () => {
  it("짧은 단계부터 맞는 첫 클래스, 다 넘으면 longest", () => {
    expect(sizeByLength("₩1,000", STEPS, "small")).toBe("big");
    expect(sizeByLength("₩1,000,000,0", STEPS, "small")).toBe("mid");
    expect(sizeByLength("₩85,000,293,105", STEPS, "small")).toBe("small");
  });
});
