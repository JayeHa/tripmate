import { describe, expect, it } from "vitest";

import { stayCardRefs } from "./stay-delete";

/** 일정 줄 */
const row = (id: string, stay_id: string | null, alternative_of: string | null = null) => ({
  id,
  stay_id,
  alternative_of,
});

describe("stayCardRefs", () => {
  it("그 숙소의 연결 카드와 그 카드들의 대체 장소 — 다른 숙소 · 다른 카드의 대체 장소는 뺀다", () => {
    const items = [row("c1", "h1"), row("c2", "h1"), row("x", "h2"), row("p", null)];
    const alternatives = [row("a1", null, "c1"), row("a2", null, "x"), row("a3", null, "p")];
    expect(stayCardRefs(items, alternatives, "h1").map((r) => r.id)).toEqual(["c1", "c2", "a1"]);
  });
});
