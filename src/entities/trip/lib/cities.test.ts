import { describe, expect, it } from "vitest";
import { cityCountLabel, coverImageUrl } from "./cities";

const city = (id: string) => ({ id, name: id });
const images = { osaka: "/city-images/osaka.aaaa.webp", kyoto: "/city-images/kyoto.bbbb.webp" };

describe("cityCountLabel", () => {
  it("도시 수를 센다", () => {
    expect(cityCountLabel([city("tokyo"), city("osaka")])).toBe("2개 도시");
  });

  it("도시가 없으면 미정", () => {
    expect(cityCountLabel([])).toBe("도시 미정");
  });
});

describe("coverImageUrl", () => {
  it("사진이 있는 첫 도시를 쓴다", () => {
    expect(coverImageUrl([city("tokyo"), city("osaka"), city("kyoto")], images)).toBe(
      "/city-images/osaka.aaaa.webp",
    );
  });

  it("사진이 하나도 없으면 null", () => {
    expect(coverImageUrl([city("tokyo")], images)).toBeNull();
  });
});
