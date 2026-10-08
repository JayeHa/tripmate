import { describe, expect, it } from "vitest";

import { bundleDateText } from "./bundle-date";

describe("bundleDateText", () => {
  it("여행 날이면 날짜 · day N", () => {
    expect(bundleDateText("2026-10-31", "2026-11-04", "2026-10-31")).toBe(
      "2026.10.31 (토) · day 1",
    );
    expect(bundleDateText("2026-10-31", "2026-11-04", "2026-11-02")).toBe(
      "2026.11.02 (월) · day 3",
    );
  });

  it("여행준비면 「여행준비」, 기간 밖이면 날짜만", () => {
    expect(bundleDateText("2026-10-31", "2026-11-04", "")).toBe("여행준비");
    expect(bundleDateText("2026-10-31", "2026-11-04", "2026-11-10")).toBe("2026.11.10 (화)");
  });
});
