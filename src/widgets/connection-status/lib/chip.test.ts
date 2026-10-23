import { describe, expect, it } from "vitest";

import { chipOf } from "./chip";

describe("동기화 칩", () => {
  it("실패가 먼저, 그다음 기다림 · 올리는 중 · 방금 다 올림, 아무것도 없으면 칩 없음", () => {
    expect(chipOf(2, 1, 1, false, true)).toEqual({ kind: "failed", count: 1 });
    expect(chipOf(2, 1, 0, false, true)).toEqual({ kind: "waiting", count: 2 });
    expect(chipOf(0, 1, 0, true, true)).toEqual({ kind: "saving" });
    expect(chipOf(0, 0, 0, true, false)).toEqual({ kind: "saved" });
    expect(chipOf(0, 0, 0, false, false)).toBeNull();
  });

  it("온라인에서 바로 올리는 체크는 칩 없이 — 기다리던 변경을 올릴 때만 「저장 중…」", () => {
    expect(chipOf(0, 1, 0, false, false)).toBeNull();
  });
});
