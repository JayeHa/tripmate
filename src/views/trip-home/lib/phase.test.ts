import { describe, expect, it } from "vitest";

import { phaseNote, tripPhase } from "./phase";

const start = "2026-10-31";
const end = "2026-11-04";

describe("tripPhase", () => {
  it("출발 전 · 출발일부터 마지막 날까지 · 끝난 뒤", () => {
    expect(tripPhase(start, end, "2026-10-30")).toBe("pre");
    expect(tripPhase(start, end, start)).toBe("now");
    expect(tripPhase(start, end, end)).toBe("now");
    expect(tripPhase(start, end, "2026-11-05")).toBe("post");
  });
});

describe("phaseNote", () => {
  it("날짜로 고른 시점의 안내", () => {
    expect(phaseNote("pre", start, end, "2026-10-19")).toBe("날짜로 자동 선택");
    expect(phaseNote("now", start, end, "2026-11-01")).toBe("day 2 · 11.1");
    expect(phaseNote("post", start, end, "2026-11-06")).toBe("11.6 · 여행 끝");
  });

  it("다른 시점을 고르면 미리보기", () => {
    expect(phaseNote("now", start, end, "2026-10-19")).toBe("미리보기");
  });
});
