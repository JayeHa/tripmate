import { describe, expect, it } from "vitest";
import { splitEqual, validateCustomShares } from "../split";

describe("splitEqual", () => {
  it("splits 1000 JPY among 3 as 334/333/333", () => {
    const shares = splitEqual(1000, "JPY", ["c", "a", "b"]);
    expect(shares.map((s) => s.userId)).toEqual(["a", "b", "c"]);
    expect(shares.map((s) => s.share)).toEqual([334, 333, 333]);
    expect(shares.reduce((acc, s) => acc + s.share, 0)).toBe(1000);
  });
  it("splits 10 KRW among 3 as 4/3/3", () => {
    expect(splitEqual(10, "KRW", ["a", "b", "c"]).map((s) => s.share)).toEqual([4, 3, 3]);
  });
  it("splits 10.00 USD among 3 as 3.34/3.33/3.33", () => {
    expect(splitEqual(10, "USD", ["a", "b", "c"]).map((s) => s.share)).toEqual([3.34, 3.33, 3.33]);
  });
  it("gives everything to a single participant", () => {
    expect(splitEqual(777, "KRW", ["a"])).toEqual([{ userId: "a", share: 777 }]);
  });
  it("dedupes participants", () => {
    expect(splitEqual(100, "KRW", ["a", "a", "b"]).map((s) => s.share)).toEqual([50, 50]);
  });
  it("throws with no participants", () => {
    expect(() => splitEqual(100, "KRW", [])).toThrow();
  });
});

describe("validateCustomShares", () => {
  it("accepts exact sum", () => {
    const r = validateCustomShares(1000, "JPY", [
      { userId: "a", share: 600 },
      { userId: "b", share: 400 },
    ]);
    expect(r.ok).toBe(true);
  });
  it("rejects off-by-one minor unit", () => {
    const r = validateCustomShares(1000, "JPY", [
      { userId: "a", share: 600 },
      { userId: "b", share: 399 },
    ]);
    expect(r.ok).toBe(false);
  });
  it("accepts cents that sum exactly", () => {
    const r = validateCustomShares(10, "USD", [
      { userId: "a", share: 3.34 },
      { userId: "b", share: 3.33 },
      { userId: "c", share: 3.33 },
    ]);
    expect(r.ok).toBe(true);
  });
  it("rejects negative", () => {
    const r = validateCustomShares(100, "KRW", [
      { userId: "a", share: 150 },
      { userId: "b", share: -50 },
    ]);
    expect(r.ok).toBe(false);
  });
});
