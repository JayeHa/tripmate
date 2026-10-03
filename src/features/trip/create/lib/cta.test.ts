import { describe, expect, it } from "vitest";
import { cityCtaLabel, dateCtaLabel } from "./cta";

describe("cityCtaLabel", () => {
  it("고른 게 없으면 안내", () => {
    expect(cityCtaLabel([])).toBe("최소 1개 도시 선택");
  });

  it("두 곳까지는 이름을 다 보인다", () => {
    expect(cityCtaLabel(["도쿄"])).toBe("도쿄 선택 완료");
    expect(cityCtaLabel(["도쿄", "오사카"])).toBe("도쿄·오사카 선택 완료");
  });

  it("세 곳부터는 외 N곳", () => {
    expect(cityCtaLabel(["도쿄", "오사카", "후쿠오카", "삿포로"])).toBe(
      "도쿄·오사카 외 2곳 선택 완료",
    );
  });
});

describe("dateCtaLabel", () => {
  it("단계마다 다음 할 일을 알려 준다", () => {
    expect(dateCtaLabel(null)).toBe("출발일을 선택해 주세요");
    expect(dateCtaLabel({ start: "2026-11-06", end: null })).toBe("도착일을 선택해 주세요");
  });

  it("다 고르면 기간", () => {
    expect(dateCtaLabel({ start: "2026-11-06", end: "2026-11-08" })).toBe(
      "2026.11.6 - 11.8 / 등록 완료",
    );
  });
});
