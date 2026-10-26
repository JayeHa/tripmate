import { describe, expect, it } from "vitest";

import { parseHomeTab } from "./home-tabs";

describe("parseHomeTab", () => {
  it("모르는 값 · 없음은 요약", () => {
    expect(parseHomeTab("food")).toBe("food");
    expect(parseHomeTab("x")).toBe("summary");
    expect(parseHomeTab(null)).toBe("summary");
  });
});
