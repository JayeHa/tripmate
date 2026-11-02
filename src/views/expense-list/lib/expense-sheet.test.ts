import { describe, expect, it } from "vitest";

import { sheetOfParam, sheetToParam } from "./expense-sheet";

describe("가계부 목록 위의 창 검색값", () => {
  it("창 ↔ 검색값이 돌아온다", () => {
    for (const sheet of [
      { kind: "new", period: null },
      { kind: "new", period: "2" },
      { kind: "new", period: "prep" },
      { kind: "view", id: "e1" },
      { kind: "edit", id: "e1" },
    ] as const) {
      expect(sheetOfParam(sheetToParam(sheet))).toEqual(sheet);
    }
  });

  it("비었거나 모르는 모양이면 null", () => {
    expect(sheetOfParam(null)).toBeNull();
    expect(sheetOfParam("")).toBeNull();
    expect(sheetOfParam("view:")).toBeNull();
    expect(sheetOfParam("open:e1")).toBeNull();
  });
});
