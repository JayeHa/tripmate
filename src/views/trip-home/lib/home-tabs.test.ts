import { describe, expect, it } from "vitest";

import { parseHomeTab } from "./home-tabs";

describe("parseHomeTab", () => {
  it("모르는 값 · 없음은 메인", () => {
    expect(parseHomeTab("food")).toBe("food");
    expect(parseHomeTab("x")).toBe("main");
    expect(parseHomeTab(null)).toBe("main");
  });
});
