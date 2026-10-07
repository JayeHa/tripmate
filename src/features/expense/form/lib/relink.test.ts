import { describe, expect, it } from "vitest";

import { relinkRows } from "./relink";

describe("relinkRows", () => {
  const current = { day: "day 1 · 10.31 (토)", category: "food" as const, name: "이치란" };

  it("달라지는 칸만 — 같은 칸은 빠진다", () => {
    expect(
      relinkRows(current, { day: "day 2 · 11.1 (일)", category: "food", name: "츠케멘" }),
    ).toEqual([
      { label: "날짜", from: "day 1 · 10.31 (토)", to: "day 2 · 11.1 (일)" },
      { label: "항목명", from: "이치란", to: "츠케멘" },
    ]);
  });

  it("새 일정의 카테고리를 모르면 지금 값을 둔다, 빈 항목명은 「없음」", () => {
    expect(
      relinkRows({ ...current, name: "" }, { day: current.day, category: null, name: "신주쿠" }),
    ).toEqual([{ label: "항목명", from: "없음", to: "신주쿠" }]);
  });
});
