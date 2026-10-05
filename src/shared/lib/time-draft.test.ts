import { describe, expect, it } from "vitest";

import {
  draftValue,
  minuteOutOfRange,
  minuteSteps,
  parseTime,
  pickHour,
  pickMinute,
  typeMinute,
} from "./time-draft";

describe("parseTime", () => {
  it("HH:mm · HH:mm:ss 를 읽고, 비거나 틀리면 둘 다 null", () => {
    expect(parseTime("16:05")).toEqual({ h: 16, m: 5 });
    expect(parseTime("09:40:00")).toEqual({ h: 9, m: 40 });
    expect(parseTime("")).toEqual({ h: null, m: null });
    expect(parseTime("25:00")).toEqual({ h: null, m: null });
    expect(parseTime(null)).toEqual({ h: null, m: null });
  });
});

describe("고르기", () => {
  const empty = { h: null, m: null };
  it("시만 고르면 00분, 분만 고르면 09시", () => {
    expect(pickHour(empty, 16)).toEqual({ h: 16, m: 0 });
    expect(pickMinute(empty, 30)).toEqual({ h: 9, m: 30 });
    expect(pickHour({ h: 9, m: 30 }, 16)).toEqual({ h: 16, m: 30 });
  });

  it("분 직접 입력: 숫자 두 자리까지, 60 이상 · 빈칸이면 분 없음", () => {
    expect(typeMinute({ h: 16, m: 0 }, "3a7")).toEqual({ draft: { h: 16, m: 37 }, text: "37" });
    expect(typeMinute(empty, "58")).toEqual({ draft: { h: 9, m: 58 }, text: "58" });
    expect(typeMinute({ h: 16, m: 0 }, "75")).toEqual({ draft: { h: 16, m: null }, text: "75" });
    expect(typeMinute({ h: 16, m: 0 }, "")).toEqual({ draft: { h: 16, m: null }, text: "" });
  });
});

describe("draftValue · minuteOutOfRange · minuteSteps", () => {
  it("시가 없거나 분이 범위 밖이면 빈 값", () => {
    expect(draftValue({ h: 16, m: 5 }, null)).toBe("16:05");
    expect(draftValue({ h: 16, m: null }, null)).toBe("16:00");
    expect(draftValue({ h: null, m: 5 }, null)).toBe("");
    expect(draftValue({ h: 16, m: null }, "75")).toBe("");
    expect(minuteOutOfRange("75")).toBe(true);
    expect(minuteOutOfRange("")).toBe(false);
    expect(minuteSteps(5)).toHaveLength(12);
    expect(minuteSteps(15)).toEqual([0, 15, 30, 45]);
  });
});
