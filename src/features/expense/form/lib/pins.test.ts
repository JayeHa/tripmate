import { describe, expect, it } from "vitest";

import { parsePins, pinHint, pinToast } from "./pins";

describe("pins", () => {
  it("저장된 값에서 아는 칸만 정해진 순서로", () => {
    expect(parsePins(["receipts", "nope", "paid"])).toEqual(["paid", "receipts"]);
    expect(parsePins("receipts")).toEqual([]);
    expect(parsePins(null)).toEqual([]);
  });

  it("접힌 안내는 고정하지 않은 칸만", () => {
    expect(pinHint([])).toBe("결제 상태 · 메모 · 영수증 · 합계 제외");
    expect(pinHint(["receipts"])).toBe("결제 상태 · 메모 · 합계 제외");
  });

  it("토스트 — 받침에 맞는 조사", () => {
    expect(pinToast("receipts", true)).toBe("영수증을 위에 고정했어요");
    expect(pinToast("memo", true)).toBe("메모를 위에 고정했어요");
    expect(pinToast("excluded", false)).toBe("합계 제외 고정을 풀었어요");
  });
});
