import { describe, expect, it } from "vitest";

import { dayOptions, dayOptionText } from "./day-options";

describe("dayOptions", () => {
  it("여행준비 다음 여행 날짜마다 한 줄", () => {
    expect(dayOptions("2026-10-31", "2026-11-01")).toEqual([
      { value: "", label: "여행준비", sub: "" },
      { value: "2026-10-31", label: "day 1", sub: "10.31 (토)" },
      { value: "2026-11-01", label: "day 2", sub: "11.1 (일)" },
    ]);
  });
});

describe("dayOptionText", () => {
  const options = dayOptions("2026-10-31", "2026-11-01");

  it("여행준비는 이름만, 여행 날짜는 day 와 날짜", () => {
    expect(dayOptionText(options, "")).toBe("여행준비");
    expect(dayOptionText(options, "2026-11-01")).toBe("day 2 · 11.1 (일)");
  });

  it("기간 밖 날짜는 날짜 그대로", () => {
    expect(dayOptionText(options, "2026-11-05")).toBe("2026-11-05");
  });
});
