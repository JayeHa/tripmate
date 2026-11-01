import { describe, expect, it } from "vitest";

import { outfitFor } from "./outfit";

describe("outfitFor", () => {
  it("하루 평균 기온 구간으로 고른다", () => {
    expect(outfitFor({ max: 33, min: 25, rain: null })).toEqual(["민소매", "반팔", "반바지"]);
    expect(outfitFor({ max: 22, min: 13, rain: null })).toEqual(["맨투맨", "가디건", "긴바지"]);
    expect(outfitFor({ max: 10, min: 4, rain: null })).toEqual(["코트", "히트텍", "목도리"]);
    expect(outfitFor({ max: 3, min: -5, rain: null })).toEqual(["패딩", "장갑", "목도리"]);
  });

  it("구간 경계 — 평균을 반올림해 그 이상인 첫 구간", () => {
    expect(outfitFor({ max: 30, min: 25, rain: null })[0]).toBe("민소매"); // 27.5 → 28
    expect(outfitFor({ max: 30, min: 24, rain: null })[0]).toBe("반팔"); // 27
  });

  it("겉옷이 없는 구간에서 일교차 10° 이상이면 겉옷 챙기기", () => {
    expect(outfitFor({ max: 30, min: 18, rain: null })).toEqual([
      "반팔",
      "얇은 셔츠",
      "면바지",
      "겉옷 챙기기",
    ]);
    expect(outfitFor({ max: 27, min: 18, rain: null })).not.toContain("겉옷 챙기기");
    expect(outfitFor({ max: 23, min: 9, rain: null })).not.toContain("겉옷 챙기기");
  });

  it("비 올 확률 50% 이상이면 우산", () => {
    expect(outfitFor({ max: 22, min: 13, rain: 95 })).toContain("우산");
    expect(outfitFor({ max: 22, min: 13, rain: 49 })).not.toContain("우산");
  });
});
