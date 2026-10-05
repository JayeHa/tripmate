import { describe, expect, it } from "vitest";

import {
  draftValue,
  hourComplete,
  hourOutOfRange,
  minuteOutOfRange,
  parseTime,
  pickHour,
  pickMinute,
  typeHour,
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

  it("시 직접 입력: 숫자 두 자리까지, 24 이상 · 빈칸이면 시 없음, 분을 안 골랐으면 00분", () => {
    expect(typeHour(empty, "1a6")).toEqual({ draft: { h: 16, m: 0 }, text: "16" });
    expect(typeHour({ h: 9, m: 30 }, "7")).toEqual({ draft: { h: 7, m: 30 }, text: "7" });
    expect(typeHour({ h: 9, m: 30 }, "24")).toEqual({ draft: { h: null, m: 30 }, text: "24" });
    expect(typeHour({ h: 9, m: 30 }, "")).toEqual({ draft: { h: null, m: 30 }, text: "" });
  });
});

describe("draftValue · 범위 밖", () => {
  it("시가 없거나 분이 범위 밖이면 빈 값", () => {
    expect(draftValue({ h: 16, m: 5 }, null)).toBe("16:05");
    expect(draftValue({ h: 16, m: null }, null)).toBe("16:00");
    expect(draftValue({ h: null, m: 5 }, null)).toBe("");
    expect(draftValue({ h: 16, m: null }, "75")).toBe("");
    // 분 칸을 지운 채면(다시 치는 중) 고르지 않은 00분이 저장되지 않게 막는다
    expect(draftValue({ h: 16, m: null }, "")).toBe("");
    // 시 칸을 비웠거나 범위 밖이면 확인을 막는다
    expect(draftValue({ h: 16, m: 5 }, null, "")).toBe("");
    expect(draftValue({ h: 16, m: 5 }, null, "16")).toBe("16:05");
    expect(hourOutOfRange("24")).toBe(true);
    expect(hourOutOfRange("23")).toBe(false);
    expect(minuteOutOfRange("75")).toBe(true);
    expect(minuteOutOfRange("")).toBe(false);
  });
});

describe("hourComplete", () => {
  it("두 자리(23 이하)거나 3–9 한 자리면 다 친 것", () => {
    expect(hourComplete("12")).toBe(true);
    expect(hourComplete("5")).toBe(true);
    expect(hourComplete("1")).toBe(false);
    expect(hourComplete("2")).toBe(false);
    expect(hourComplete("24")).toBe(false);
    expect(hourComplete("")).toBe(false);
  });
});
