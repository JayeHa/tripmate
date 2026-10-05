import { describe, expect, it } from "vitest";

import {
  acceptHour,
  acceptMinute,
  commitTime,
  splitTime,
  splitValue,
  stepPart,
  timeErrorText,
} from "./time-input";

describe("시 · 분 칸 입력", () => {
  it("시: 3–9 로 시작하면 바로 0N, 0–2 는 둘째를 기다리고 2 다음은 0–3 만", () => {
    expect(acceptHour("5")).toEqual({ text: "05", done: true });
    expect(acceptHour("1")).toEqual({ text: "1", done: false });
    expect(acceptHour("12")).toEqual({ text: "12", done: true });
    expect(acceptHour("23")).toEqual({ text: "23", done: true });
    expect(acceptHour("27")).toEqual({ text: "2", done: false });
    expect(acceptHour("a")).toEqual({ text: "", done: false });
  });

  it("분: 6–9 로 시작하면 바로 0N, 두 자리면 끝", () => {
    expect(acceptMinute("7")).toEqual({ text: "07", done: true });
    expect(acceptMinute("3")).toEqual({ text: "3", done: false });
    expect(acceptMinute("32")).toEqual({ text: "32", done: true });
  });

  it("붙여넣기 · 몰아치기를 시 · 분으로 나눈다(세 자리는 H:MM)", () => {
    expect(splitTime("14:30")).toEqual({ hour: "14", minute: "30" });
    expect(splitTime("14 30")).toEqual({ hour: "14", minute: "30" });
    expect(splitTime("1430")).toEqual({ hour: "14", minute: "30" });
    expect(splitTime("930")).toEqual({ hour: "9", minute: "30" });
    expect(splitTime("오후 2시")).toBeNull();
  });
});

describe("확정", () => {
  it("둘 다 비면 시간 없음, 시가 한 자리면 0N, 시만 있으면 00분", () => {
    expect(commitTime("", "")).toEqual({ value: "" });
    expect(commitTime("9", "5")).toEqual({ value: "09:05" });
    expect(commitTime("14", "")).toEqual({ value: "14:00" });
  });

  it("시가 없거나 범위 밖이면 그 칸 오류", () => {
    expect(commitTime("", "30")).toEqual({ error: "hour" });
    expect(commitTime("25", "00")).toEqual({ error: "hour" });
    expect(commitTime("14", "70")).toEqual({ error: "minute" });
    expect(timeErrorText("hour", "")).toBe("시를 입력해 주세요");
    expect(timeErrorText("hour", "25")).toBe("00–23 사이로 입력해 주세요");
    expect(timeErrorText("minute", "14")).toBe("00–59 사이로 입력해 주세요");
  });
});

describe("방향키 · 저장 값", () => {
  it("↑↓ 는 범위를 넘으면 돈다", () => {
    expect(stepPart("23", 1, 23)).toBe("00");
    expect(stepPart("00", -1, 23)).toBe("23");
    expect(stepPart("55", 10, 59)).toBe("05");
    expect(stepPart("", 1, 59)).toBe("01");
  });

  it("저장된 값을 두 칸으로", () => {
    expect(splitValue("09:40:00")).toEqual({ hour: "09", minute: "40" });
    expect(splitValue("")).toEqual({ hour: "", minute: "" });
  });
});
