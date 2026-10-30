import { describe, expect, it } from "vitest";

import { dateCtaLabel, pcCityCtaLabel } from "./cta";

describe("dateCtaLabel", () => {
  it("단계마다 다음 할 일을 알려 준다", () => {
    expect(dateCtaLabel(null)).toBe("출발일을 선택해 주세요");
    expect(dateCtaLabel({ start: "2026-11-06", end: null })).toBe("도착일을 선택해 주세요");
  });

  it("만드는 중이면 그것만 보인다", () => {
    expect(dateCtaLabel({ start: "2026-11-06", end: "2026-11-08" }, true)).toBe("만드는 중…");
  });

  it("다 고르면 기간", () => {
    expect(dateCtaLabel({ start: "2026-11-06", end: "2026-11-08" })).toBe(
      "2026.11.6 - 11.8 / 등록 완료",
    );
  });
});

describe("pcCityCtaLabel", () => {
  it("고른 도시가 있으면 다음 단계로", () => {
    expect(pcCityCtaLabel(0)).toBe("최소 1개 도시 선택");
    expect(pcCityCtaLabel(2)).toBe("다음 · 날짜 선택");
  });
});
