import { describe, expect, it } from "vitest";

import {
  addDays,
  datesBetween,
  fromLastYear,
  lastYearOf,
  lastYearSpan,
  localTodayOf,
  markForecast,
  normalDays,
  parseRange,
  splitRange,
} from "./weather-days";

const day = (date: string, rain: number | null = 40) => ({
  date,
  code: 61,
  max: 18,
  min: 11,
  rain,
});

describe("addDays · datesBetween", () => {
  it("달 · 해를 넘긴다", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(datesBetween({ start: "2026-10-30", end: "2026-11-02" })).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("parseRange", () => {
  it("날짜가 아니거나 거꾸로거나 100일을 넘으면 null", () => {
    expect(parseRange("2026-11-01", "2026-11-05")).toEqual({
      start: "2026-11-01",
      end: "2026-11-05",
    });
    expect(parseRange("2026-02-30", "2026-03-01")).toBeNull();
    expect(parseRange("2026-11-05", "2026-11-01")).toBeNull();
    expect(parseRange(null, "2026-11-01")).toBeNull();
    expect(parseRange("2026-01-01", "2026-04-10")).toEqual({
      start: "2026-01-01",
      end: "2026-04-10",
    });
    expect(parseRange("2026-01-01", "2026-04-11")).toBeNull();
  });
});

describe("splitRange", () => {
  const today = "2026-11-01";

  it("예보 범위(90일 전 ~ 15일 뒤) 안은 예보, 앞은 과거 기록, 뒤는 작년", () => {
    expect(splitRange({ start: "2026-08-01", end: "2026-11-20" }, today)).toEqual({
      past: { start: "2026-08-01", end: "2026-08-02" },
      forecast: { start: "2026-08-03", end: "2026-11-16" },
      far: { start: "2026-11-17", end: "2026-11-20" },
    });
  });

  it("한쪽에만 걸리면 나머지는 null", () => {
    expect(splitRange({ start: "2026-10-30", end: "2026-11-03" }, today)).toEqual({
      past: null,
      forecast: { start: "2026-10-30", end: "2026-11-03" },
      far: null,
    });
    expect(splitRange({ start: "2027-02-01", end: "2027-02-05" }, today).forecast).toBeNull();
  });
});

describe("작년 같은 날", () => {
  it("2월 29일은 2월 28일", () => {
    expect(lastYearOf("2028-02-29")).toBe("2027-02-28");
    expect(lastYearOf("2027-03-01")).toBe("2026-03-01");
  });

  it("기록이 있을 기간 — 7일 전까지만, 1년 넘게 남았으면 null", () => {
    expect(lastYearSpan({ start: "2027-01-10", end: "2027-01-12" }, "2026-11-01")).toEqual({
      start: "2026-01-10",
      end: "2026-01-12",
    });
    expect(lastYearSpan({ start: "2027-10-20", end: "2027-10-30" }, "2026-11-01")).toEqual({
      start: "2026-10-20",
      end: "2026-10-25",
    });
    expect(lastYearSpan({ start: "2027-12-01", end: "2027-12-03" }, "2026-11-01")).toBeNull();
  });

  it("기록이 있는 날은 올해 날짜로 옮기고 없는 날은 missing", () => {
    const { found, missing } = fromLastYear(["2027-01-10", "2027-01-11"], [day("2026-01-10")]);
    expect(found).toEqual([{ ...day("2027-01-10"), rain: null, source: "lastYear" }]);
    expect(missing).toEqual(["2027-01-11"]);
  });
});

describe("출처", () => {
  it("그 장소의 오늘 — 응답의 시간대로", () => {
    const now = new Date("2026-10-31T16:00:00Z");
    expect(localTodayOf({ utc_offset_seconds: 32400 }, now)).toBe("2026-11-01");
    expect(localTodayOf({}, now)).toBe("2026-10-31");
  });

  it("오늘 전은 기록(비 올 확률 뺌), 오늘부터 예보", () => {
    expect(markForecast([day("2026-10-31"), day("2026-11-01")], "2026-11-01")).toEqual([
      { ...day("2026-10-31"), rain: null, source: "record" },
      { ...day("2026-11-01"), source: "forecast" },
    ]);
  });

  it("평년 — 그 달 값, 모르는 달은 뺀다", () => {
    const normals = (m: number) => (m === 1 ? { min: 2, max: 10 } : null);
    expect(normalDays(["2028-01-05", "2028-02-01"], normals)).toEqual([
      { date: "2028-01-05", code: null, max: 10, min: 2, rain: null, source: "normal" },
    ]);
  });
});
