import { describe, expect, it } from "vitest";

import { mapDayOf, pickFocus, pickVisibleDay, pinScrollTarget } from "./focus";

const rows = [
  { id: "a", top: 100 },
  { id: "b", top: 300 },
  { id: "c", top: 500 },
];

describe("pickFocus", () => {
  it("기준선을 지난 마지막 행", () => {
    expect(pickFocus(rows, 350)).toBe("b");
  });

  it("윗변이 기준선과 같으면 지난 것으로 본다", () => {
    expect(pickFocus(rows, 500)).toBe("c");
  });

  it("아무것도 지나지 않았으면 첫 행", () => {
    expect(pickFocus(rows, 50)).toBe("a");
  });

  it("후보가 없으면 null", () => {
    expect(pickFocus([], 200)).toBeNull();
  });
});

describe("pinScrollTarget", () => {
  it("기준선이 고정이면 행을 기준선 − margin 으로 옮기는 만큼 스크롤한다", () => {
    // 행이 화면 500, 기준선 120 → 392 만큼 내려 행이 108(120 − 12) 에 온다
    expect(pinScrollTarget(500, 0, 2000, () => 120, 12)).toBe(392);
  });

  it("기준선이 스크롤과 함께 내려가면 그만큼 덜 스크롤한다", () => {
    // 기준선 = min(400, t + 120): t 만큼 스크롤하면 행은 500 − t, 기준선은 t + 120 → t = 196
    const t = pinScrollTarget(500, 0, 2000, (s) => Math.min(400, s + 120), 12);
    expect(t).toBe(196);
    expect(500 - t).toBeLessThanOrEqual(Math.min(400, t + 120) - 12 + 0.5);
  });

  it("기준선이 붙기 전에는 스크롤만큼 올라가다 붙으면 멈춰도(모바일 sticky) 붙은 뒤의 기준선에 맞춘다", () => {
    // 기준선 = max(300, 500 − t) + 48: t ≥ 200 에서 348 에 멈춘다 → 행 1000 − t = 336 → t = 664
    expect(pinScrollTarget(1000, 0, 3000, (s) => Math.max(300, 500 - s) + 48, 12)).toBe(664);
  });

  it("이미 기준선 위면 맨 위(0)보다 위로는 가지 않는다", () => {
    expect(pinScrollTarget(60, 0, 2000, () => 120, 12)).toBe(0);
  });

  it("끝까지 내려도 닿지 않으면 끝에서 멈춘다", () => {
    expect(pinScrollTarget(3000, 0, 500, () => 120, 12)).toBe(500);
  });
});

describe("pickVisibleDay", () => {
  const sections = [
    { day: 0, top: -400 },
    { day: 1, top: 80 },
    { day: 2, top: 600 },
  ];
  it("머리가 기준선을 지난 마지막 날짜, 아직 아무것도 안 지났으면 첫 날짜", () => {
    expect(pickVisibleDay(sections, 100)).toBe(1);
    expect(pickVisibleDay(sections, 80)).toBe(1);
    expect(pickVisibleDay(sections, 79)).toBe(0);
    expect(pickVisibleDay([{ day: 3, top: 500 }], 100)).toBe(3);
    expect(pickVisibleDay([], 100)).toBeNull();
  });
});

describe("mapDayOf", () => {
  const sections = [
    { day: 0, rows: [{ item: { id: "a" } }] },
    { day: 1, rows: [{ item: { id: "b" } }, { item: { id: "c" } }] },
  ];
  it("강조된 장소가 있으면 그 장소의 날", () => {
    expect(mapDayOf(sections, "c", 0)).toBe(1);
  });
  it("강조가 없거나 어느 날에도 없으면 보고 있는 날", () => {
    expect(mapDayOf(sections, null, 0)).toBe(0);
    expect(mapDayOf(sections, "gone", 1)).toBe(1);
  });
});
