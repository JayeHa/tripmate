import { describe, expect, it } from "vitest";

import { categoryFromGoogle } from "./google-category";

describe("categoryFromGoogle", () => {
  it("대표 종류부터 보고, 꼬리 규칙으로도 맞춘다", () => {
    expect(categoryFromGoogle(["cafe", "food", "store"])).toBe("cafe");
    expect(categoryFromGoogle(["ramen_restaurant", "restaurant"])).toBe("food");
    expect(categoryFromGoogle(["resort_hotel"])).toBe("stay");
    expect(categoryFromGoogle(["clothing_store"])).toBe("shop");
    expect(categoryFromGoogle(["public_bath"])).toBe("rest");
    expect(categoryFromGoogle(["tourist_attraction", "point_of_interest"])).toBe("sight");
  });

  it("폼에 없는 종류(역 · 공항)뿐이면 null", () => {
    expect(categoryFromGoogle(["train_station", "transit_station"])).toBeNull();
    expect(categoryFromGoogle([])).toBeNull();
  });
});
