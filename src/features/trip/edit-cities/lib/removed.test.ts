import { describe, expect, it } from "vitest";

import type { City } from "@/entities/city";

import { keptItems, keptItemsLabel, removedCities, sameCities } from "./removed";

/** 테스트용 도시 — id 와 이름만 */
const city = (id: string, name: string) => ({ id, name }) as City;
const TOKYO = city("tokyo", "도쿄");
const OSAKA = city("osaka", "오사카");
const KYOTO = city("kyoto", "교토");

describe("removedCities · sameCities", () => {
  it("새 목록에 없는 도시를 지금 순서대로", () => {
    expect(removedCities([TOKYO, OSAKA, KYOTO], [KYOTO, TOKYO])).toEqual([OSAKA]);
    expect(removedCities([TOKYO], [TOKYO, OSAKA])).toEqual([]);
  });

  it("순서까지 같아야 같은 목록 — 첫 도시가 바뀌면 저장한다", () => {
    expect(sameCities([TOKYO, OSAKA], [TOKYO, OSAKA])).toBe(true);
    expect(sameCities([TOKYO, OSAKA], [OSAKA, TOKYO])).toBe(false);
    expect(sameCities([TOKYO], [TOKYO, OSAKA])).toBe(false);
  });
});

describe("keptItems · keptItemsLabel", () => {
  it("일정이 있는 도시만 남기고 개수를 합친다", () => {
    const kept = keptItems([OSAKA, KYOTO, TOKYO], { osaka: 3, tokyo: 2 });
    expect(kept).toEqual([
      { name: "오사카", count: 3 },
      { name: "도쿄", count: 2 },
    ]);
    expect(keptItemsLabel(kept)).toBe("오사카 · 도쿄 일정 5개는 그대로 남아요");
    expect(keptItems([KYOTO], {})).toEqual([]);
  });
});
