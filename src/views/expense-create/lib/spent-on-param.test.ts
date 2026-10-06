import { describe, expect, it } from "vitest";

import { spentOnFromParam } from "./spent-on-param";

describe("spentOnFromParam", () => {
  const start = "2026-10-31";
  const end = "2026-11-04";

  it("prep 은 여행준비(빈 글), 숫자는 그날", () => {
    expect(spentOnFromParam("prep", start, end)).toBe("");
    expect(spentOnFromParam("0", start, end)).toBe("2026-10-31");
    expect(spentOnFromParam("4", start, end)).toBe("2026-11-04");
  });

  it("없거나 모르는 값 · 기간 밖이면 undefined(여행 첫날)", () => {
    expect(spentOnFromParam(null, start, end)).toBeUndefined();
    expect(spentOnFromParam("x", start, end)).toBeUndefined();
    expect(spentOnFromParam("5", start, end)).toBeUndefined();
    expect(spentOnFromParam("-1", start, end)).toBeUndefined();
  });
});
