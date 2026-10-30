import { describe, expect, it } from "vitest";

import { checkRates, hasChanges, initialDrafts, newDraft, removedInUse } from "./rate-draft";

/** 순서대로 r0, r1 … */
function ids() {
  let n = 0;
  return () => `r${n++}`;
}

const SAVED = { JPY: { unit: 100, value: 920.0000001 }, USD: { unit: 1, value: 1400 } };

describe("initialDrafts", () => {
  it("지금 여행 환율을 줄로 — 반올림 끝자리는 지운다", () => {
    expect(initialDrafts(SAVED, "KRW", "JPY", ids())).toEqual([
      { id: "r0", code: "JPY", unit: "100", value: "920" },
      { id: "r1", code: "USD", unit: "1", value: "1400" },
    ]);
  });
  it("여행지 통화가 없으면 대략 값을 채운 줄을 맨 위에(#251)", () => {
    expect(initialDrafts({}, "KRW", "JPY", ids())).toEqual([
      { id: "r0", code: "JPY", unit: "100", value: "920" },
    ]);
  });
  it("여행지 통화가 기준 화폐거나 모르면 채우지 않는다", () => {
    expect(initialDrafts({}, "KRW", "KRW", ids())).toEqual([]);
    expect(initialDrafts({}, "KRW", null, ids())).toEqual([]);
  });
});

describe("newDraft", () => {
  it("기준 화폐 · 있는 통화가 아닌 첫 통화", () => {
    const rows = initialDrafts(SAVED, "KRW", null, ids());
    expect(newDraft(rows, "KRW", () => "n")?.code).not.toMatch(/KRW|JPY|USD/);
  });
});

describe("checkRates", () => {
  it("손대지 않은 줄은 보내지 않는다", () => {
    const { changes, error } = checkRates(SAVED, initialDrafts(SAVED, "KRW", null, ids()));
    expect(error).toBeNull();
    expect(hasChanges(changes)).toBe(false);
  });
  it("고친 줄 · 새 줄만 보내고, 없앤 통화는 뺀다", () => {
    const rows = [
      { id: "a", code: "JPY", unit: "100", value: "900" },
      { id: "b", code: "TWD", unit: "1", value: "43" },
    ];
    expect(checkRates(SAVED, rows).changes).toEqual({
      set: { JPY: { unit: 100, value: 900 }, TWD: { unit: 1, value: 43 } },
      remove: ["USD"],
    });
  });
  it("통화를 바꾼 줄은 옛 통화를 빼고 새 통화를 넣는다 — 쉼표는 지운다", () => {
    const rows = [
      { id: "a", code: "JPY", unit: "100", value: "920" },
      { id: "b", code: "EUR", unit: "1", value: "1,500" },
    ];
    expect(checkRates(SAVED, rows).changes).toEqual({
      set: { EUR: { unit: 1, value: 1500 } },
      remove: ["USD"],
    });
  });
  it("빈 칸 · 0 · 같은 통화 두 줄은 막는다", () => {
    expect(checkRates({}, [{ id: "a", code: "JPY", unit: "100", value: "" }]).error).toMatch(
      /0보다 큰/,
    );
    expect(checkRates({}, [{ id: "a", code: "JPY", unit: "0", value: "9" }]).error).toMatch(
      /0보다 큰/,
    );
    const twice = [
      { id: "a", code: "JPY", unit: "100", value: "920" },
      { id: "b", code: "JPY", unit: "1", value: "9" },
    ];
    expect(checkRates({}, twice).error).toMatch(/JPY 가 두 줄/);
  });
});

describe("removedInUse", () => {
  it("뺄 통화 중 지출이 쓰는 것만, 건수와 함께", () => {
    const expenses = [{ currency: "USD" }, { currency: "USD" }, { currency: "KRW" }];
    expect(removedInUse(["USD", "TWD"], expenses)).toEqual([{ code: "USD", count: 2 }]);
  });
});
