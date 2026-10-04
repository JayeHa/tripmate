import { describe, expect, it } from "vitest";

import { hoursOnDay, weekDayOf, weekHoursOf } from "./hours";

const SUN = 0;
const MON = 1;
const SAT = 6;

describe("weekDayOf", () => {
  it("Date.getDay() 를 요일 키로", () => {
    expect(weekDayOf(SUN)).toBe("sun");
    expect(weekDayOf(MON)).toBe("mon");
    expect(weekDayOf(SAT)).toBe("sat");
  });
});

describe("weekHoursOf", () => {
  it("모르는 키 · 틀린 값은 버리고 아는 요일만 남긴다", () => {
    expect(weekHoursOf({ mon: "11:00–22:00", Mon: "x", holiday: "y", tue: 3, sun: null })).toEqual({
      mon: "11:00–22:00",
      sun: null,
    });
  });

  it("요일 값이 하나도 없거나 모양이 틀리면 null", () => {
    expect(weekHoursOf({})).toBeNull();
    expect(weekHoursOf(null)).toBeNull();
    expect(weekHoursOf(["mon"])).toBeNull();
    expect(weekHoursOf({ mon: 1 })).toBeNull();
    expect(weekHoursOf({ sun: null })).toEqual({ sun: null });
  });
});

describe("hoursOnDay", () => {
  const week = { hours: null, hours_week: { mon: "11:00–22:00", sun: null } };

  it("요일별이면 그 요일 값만, 휴무면 off", () => {
    expect(hoursOnDay(week, MON)).toEqual({ text: "월 11:00–22:00", off: false });
    expect(hoursOnDay(week, SUN)).toEqual({ text: "일요일 휴무", off: true });
  });

  it("그 요일을 모르거나 날짜를 모르면 null", () => {
    expect(hoursOnDay(week, SAT)).toBeNull();
    expect(hoursOnDay(week, null)).toBeNull();
  });

  it("요일별이 없으면(또는 {}) 매일 같은 운영시간", () => {
    expect(hoursOnDay({ hours: "10:00–20:00", hours_week: {} }, SUN)).toEqual({
      text: "10:00–20:00",
      off: false,
    });
    expect(hoursOnDay({ hours: null, hours_week: null }, SUN)).toBeNull();
  });
});
