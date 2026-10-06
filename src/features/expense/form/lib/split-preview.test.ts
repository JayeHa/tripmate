import { describe, expect, it } from "vitest";

import { splitPreview } from "./split-preview";

const NAMES: Record<string, string> = { a: "정원", b: "동규", c: "서연" };
const base = {
  amount: 30000,
  currency: "KRW",
  splitEach: false,
  payer: "a",
  participants: ["a", "b", "c"],
  nameOf: (key: string) => NAMES[key],
};

describe("splitPreview", () => {
  it("나눠 낸 비용 — 1인 몫과 누가 결제한 사람에게 보낼지", () => {
    expect(splitPreview(base)).toEqual({
      head: "3명이 나눠요 · 1인 ≈ ₩10,000",
      sub: "동규 · 서연 → 정원 각 ₩10,000",
    });
  });

  it("보낼 사람이 한 명이면 「각」 을 붙이지 않는다", () => {
    expect(splitPreview({ ...base, participants: ["a", "b"] })?.sub).toBe("동규 → 정원 ₩15,000");
  });

  it("결제한 사람이 함께하지 않았으면 함께한 사람 모두가 보낸다", () => {
    expect(splitPreview({ ...base, payer: "c", participants: ["a", "b"] })?.sub).toBe(
      "정원 · 동규 → 서연 각 ₩15,000",
    );
  });

  it("각자 냄 — 1인 몫과 정산 없음 안내, 한 명이어도 보인다", () => {
    expect(splitPreview({ ...base, splitEach: true, payer: null, participants: ["a"] })).toEqual({
      head: "각자 냈어요 · 1인 ≈ ₩30,000",
      sub: "정산할 금액은 없어요. 개인별 지출에만 더해져요.",
    });
  });

  it("대신 결제 — 함께한 한 명이 결제자가 아니면 그 사람이 전액을 보낸다", () => {
    expect(splitPreview({ ...base, participants: ["b"] })).toEqual({
      head: "1명이 나눠요 · 1인 ≈ ₩30,000",
      sub: "동규 → 정원 ₩30,000",
    });
  });

  it("금액이 없거나 결제한 사람 혼자 쓴 돈이면 null", () => {
    expect(splitPreview({ ...base, amount: 0 })).toBeNull();
    expect(splitPreview({ ...base, participants: ["a"] })).toBeNull();
  });
});
