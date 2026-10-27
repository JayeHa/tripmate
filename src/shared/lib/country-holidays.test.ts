import { describe, expect, it } from "vitest";

import { type RawHoliday, toCountryHolidays } from "./country-holidays";

/** 그 나라 날짜 하루짜리 공휴일 한 줄(시작 ~ 끝 hours 시간) */
function raw(date: string, name: string, type = "public", hours = 24): RawHoliday {
  const start = new Date(`${date}T00:00:00Z`);
  return { date: `${date} 00:00:00`, name, type, start, end: new Date(+start + hours * 3_600_000) };
}

describe("toCountryHolidays", () => {
  it("모두 쉬는 공휴일만 날짜순으로", () => {
    expect(
      toCountryHolidays([
        raw("2026-11-23", "Labor Thanksgiving Day"),
        raw("2026-11-03", "Culture Day"),
        raw("2026-12-24", "Christmas Eve", "observance"),
        raw("2026-12-31", "Bank Holiday", "bank"),
      ]),
    ).toEqual([
      { date: "2026-11-03", name: "Culture Day" },
      { date: "2026-11-23", name: "Labor Thanksgiving Day" },
    ]);
  });

  it("반나절만 쉬는 날은 빼고, 서머타임으로 23시간인 날은 남긴다", () => {
    expect(
      toCountryHolidays([
        raw("2026-03-08", "International Women's Day", "public", 12),
        raw("2027-03-28", "Easter Sunday", "public", 23),
      ]),
    ).toEqual([{ date: "2027-03-28", name: "Easter Sunday" }]);
  });

  it("같은 날 공휴일은 이름을 이어 하나로(같은 이름은 한 번)", () => {
    expect(
      toCountryHolidays([
        raw("2026-10-01", "National Day"),
        raw("2026-10-01", "Mid-Autumn Festival"),
        raw("2026-10-01", "National Day"),
      ]),
    ).toEqual([{ date: "2026-10-01", name: "National Day · Mid-Autumn Festival" }]);
  });
});
