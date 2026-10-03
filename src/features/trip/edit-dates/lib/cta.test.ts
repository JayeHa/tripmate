import { describe, expect, it } from "vitest";

import { editCtaLabel } from "./cta";

const range = { start: "2026-11-06", end: "2026-11-08" };

describe("editCtaLabel", () => {
  it("저장 중이면 그것만", () => {
    expect(editCtaLabel(range, false, true)).toBe("수정 중…");
  });

  it("기존 기간 그대로면 바꿀 날짜를 고르라고", () => {
    expect(editCtaLabel(range, true, false)).toBe("바꿀 날짜를 골라 주세요");
  });

  it("바꿨으면 기간과 수정 완료", () => {
    expect(editCtaLabel(range, false, false)).toBe("2026.11.6 - 11.8 / 수정 완료");
  });
});
