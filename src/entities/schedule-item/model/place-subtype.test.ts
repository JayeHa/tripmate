import { describe, expect, it } from "vitest";

import { placeSubtypeOf, subtypeForCategory, subtypesFor } from "./place-subtype";

describe("place-subtype", () => {
  it("카테고리마다 목록 — 카페는 식당 목록, 관광지 · 숙소는 없다", () => {
    expect(subtypesFor("cafe")).toEqual(subtypesFor("food"));
    expect(subtypesFor("rest")).toEqual(["onsen", "massage", "foot"]);
    expect(subtypesFor("sight")).toEqual([]);
    expect(subtypesFor(null)).toEqual([]);
  });

  it("카테고리에 없는 종류는 비운다 — 카테고리를 바꿔도 맞지 않는 값이 남지 않게", () => {
    expect(subtypeForCategory("food", "ramen")).toBe("ramen");
    expect(subtypeForCategory("shop", "ramen")).toBeNull();
    expect(placeSubtypeOf({ category: "rest", subtype: "sushi" })).toBeNull();
  });
});
