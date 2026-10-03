import { describe, expect, it } from "vitest";
import { holidayNames, isHoliday } from "./holidays";

describe("holidays", () => {
  it("대체공휴일까지 안다", () => {
    expect(isHoliday("2026-10-03")).toBe(true);
    expect(isHoliday("2026-10-05")).toBe(true);
    expect(holidayNames("2026-10-05")).toEqual(["대체공휴일(개천절)"]);
  });

  it("평일은 공휴일이 아니다", () => {
    expect(isHoliday("2026-10-06")).toBe(false);
    expect(holidayNames("2026-10-06")).toBeNull();
  });

  it("데이터가 없는 해는 공휴일이 없는 것으로 본다", () => {
    expect(isHoliday("2099-01-01")).toBe(false);
  });
});
