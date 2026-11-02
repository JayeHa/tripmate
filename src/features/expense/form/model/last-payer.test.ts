import { afterEach, describe, expect, it } from "vitest";

import { readLastPayer, rememberPayer } from "./last-payer";

/** 테스트용 저장소 — node 환경에 localStorage 가 없다 */
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};

describe("마지막 결제한 사람", () => {
  afterEach(() => store.clear());

  it("여행마다 기억하고, 지금 고를 수 없는 사람이면 null", () => {
    rememberPayer("t1", "m:kim");
    rememberPayer("t2", "m:me");
    expect(readLastPayer("t1", ["m:me", "m:kim"])).toBe("m:kim");
    expect(readLastPayer("t2", ["m:me"])).toBe("m:me");
    expect(readLastPayer("t1", ["m:me"])).toBeNull();
    expect(readLastPayer("t3", ["m:me"])).toBeNull();
  });

  it("각자 냄(결제자 없음)은 앞 값을 두고, 깨진 값은 빈 묶음으로 읽는다", () => {
    rememberPayer("t1", "m:kim");
    rememberPayer("t1", null);
    expect(readLastPayer("t1", ["m:kim"])).toBe("m:kim");
    store.set("tm-exp-last-payer", "{oops");
    expect(readLastPayer("t1", ["m:kim"])).toBeNull();
  });
});
