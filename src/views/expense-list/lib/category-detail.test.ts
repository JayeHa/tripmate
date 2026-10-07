import { describe, expect, it } from "vitest";

import { categoryTitle, dayBars, parseCategoryPick } from "./category-detail";

describe("parseCategoryPick", () => {
  it("카테고리 이름이면 그것, 아니면 전체", () => {
    expect(parseCategoryPick("lodging")).toBe("lodging");
    expect(parseCategoryPick("misc")).toBe("all");
    expect(parseCategoryPick(null)).toBe("all");
  });
});

describe("categoryTitle", () => {
  it("카테고리 · 건수 · 전체 중 비율, 전체는 건수만", () => {
    expect(categoryTitle("lodging", 3, 32)).toBe("숙소 · 3건 · 전체의 32%");
    expect(categoryTitle("all", 5, 100)).toBe("전체 · 5건");
  });
});

describe("dayBars", () => {
  it("이틀 이상이면 여행 날짜는 지출이 없어도 칸(높이 0), 가장 큰 날이 60", () => {
    expect(
      dayBars([
        { period: "prep", total: 100 },
        { period: 0, total: 0 },
        { period: 1, total: 400 },
        { period: 2, total: 0 },
      ]),
    ).toEqual([
      { key: "prep", label: "준비", height: 15 },
      { key: "0", label: "D1", height: 0 },
      { key: "1", label: "D2", height: 60 },
      { key: "2", label: "D3", height: 0 },
    ]);
  });

  it("여행준비에 지출이 없으면 준비 칸은 없다", () => {
    expect(
      dayBars([
        { period: "prep", total: 0 },
        { period: 0, total: 100 },
        { period: 1, total: 100 },
      ])?.map((b) => b.label),
    ).toEqual(["D1", "D2"]);
  });

  it("지출이 하루뿐이면 막대 없음, 아주 작은 날도 4", () => {
    expect(
      dayBars([
        { period: "prep", total: 100 },
        { period: 0, total: 0 },
      ]),
    ).toBeNull();
    expect(
      dayBars([
        { period: 0, total: 1 },
        { period: 1, total: 1000 },
      ])?.[0].height,
    ).toBe(4);
  });
});
