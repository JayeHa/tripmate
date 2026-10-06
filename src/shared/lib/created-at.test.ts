import { describe, expect, it } from "vitest";

import { byCreatedAt } from "./created-at";

describe("byCreatedAt", () => {
  it("소수 초가 빠진 시각도 시각으로 비교한다 — 문자열 비교면 「:05.5」 가 「:05」 보다 앞선다", () => {
    const list = [
      { id: "b", created_at: "2026-10-06T10:00:05.5+00:00" },
      { id: "a", created_at: "2026-10-06T10:00:05+00:00" },
    ];
    expect([...list].sort(byCreatedAt).map((x) => x.id)).toEqual(["a", "b"]);
  });
});
