import { describe, expect, it } from "vitest";
import { dateRangeLabel, dateToDayIndex, dayCount, dayIndexToDate, dayLabel } from "./days";

describe("days", () => {
  it("counts inclusive days", () => {
    expect(dayCount("2026-10-29", "2026-11-02")).toBe(5);
    expect(dayCount("2026-10-29", "2026-10-29")).toBe(1);
  });

  it("maps dayIndex to date", () => {
    expect(dayIndexToDate("2026-10-29", 0)).toBe("2026-10-29");
    expect(dayIndexToDate("2026-10-29", 3)).toBe("2026-11-01");
  });

  it("maps date to dayIndex with clamping", () => {
    expect(dateToDayIndex("2026-10-29", "2026-11-02", "2026-10-31")).toBe(2);
    expect(dateToDayIndex("2026-10-29", "2026-11-02", "2026-10-01")).toBe(0);
    expect(dateToDayIndex("2026-10-29", "2026-11-02", "2026-12-01")).toBe(4);
  });

  it("formats labels in Korean", () => {
    expect(dayLabel("2026-10-29", 0)).toBe("10.29 (목)");
    expect(dateRangeLabel("2026-10-29", "2026-11-02")).toBe("2026.10.29 - 11.2");
    expect(dateRangeLabel("2026-12-30", "2027-01-02")).toBe("2026.12.30 - 2027.1.2");
  });
});
