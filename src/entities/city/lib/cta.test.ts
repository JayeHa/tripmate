import { describe, expect, it } from "vitest";

import { cityCtaLabel } from "./cta";

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
