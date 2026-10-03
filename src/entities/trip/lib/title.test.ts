import { describe, expect, it } from "vitest";
import { titleFromCities } from "./title";

describe("titleFromCities", () => {
  it("도시를 가운뎃점으로 잇는다", () => {
    expect(titleFromCities(["도쿄"])).toBe("도쿄 여행");
    expect(titleFromCities(["춘천·홍천", "강릉·속초"])).toBe("춘천·홍천·강릉·속초 여행");
  });
});
