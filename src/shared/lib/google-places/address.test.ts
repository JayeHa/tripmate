import { describe, expect, it } from "vitest";

import { cleanAddress, type GeocodeResult, localLanguage, pickGeocode } from "./address";

/** 시부야 진난 번지 결과(구글 역지오코딩 응답 모양) */
function shibuya(formatted: string, country: string): GeocodeResult {
  return {
    formatted_address: formatted,
    types: ["premise", "street_address"],
    address_components: [
      { long_name: "Shibuya", types: ["locality", "political"] },
      { long_name: country, types: ["country", "political"] },
      { long_name: "150-0041", types: ["postal_code"] },
    ],
  };
}

describe("localLanguage", () => {
  it("일본은 ja, 한국과 목록 밖 나라는 null, 소문자도 받는다", () => {
    expect(localLanguage("JP")).toBe("ja");
    expect(localLanguage("jp")).toBe("ja");
    expect(localLanguage("KR")).toBeNull();
    expect(localLanguage("BE")).toBeNull();
  });
});

describe("pickGeocode", () => {
  it("근처 가게보다 번지를, 번지가 없으면 plus code 가 아닌 첫 결과를 고른다", () => {
    const poi = { ...shibuya("블루보틀", "일본"), types: ["cafe", "establishment"] };
    const plus = { ...shibuya("8Q7X+…", "일본"), types: ["plus_code"] };
    const street = shibuya("1-chōme-7-3 Jinnan", "일본");
    expect(pickGeocode([poi, street])).toBe(street);
    expect(pickGeocode([plus, poi])).toBe(poi);
    expect(pickGeocode([plus])).toBeNull();
  });
});

describe("cleanAddress", () => {
  it("나라 이름 · 우편번호 · 〒 를 빼고 구분자를 다듬는다", () => {
    expect(cleanAddress(shibuya("1-chōme-7-3 Jinnan, Shibuya, Tokyo 150-0041 일본", "일본"))).toBe(
      "1-chōme-7-3 Jinnan, Shibuya, Tokyo",
    );
    expect(cleanAddress(shibuya("日本、〒150-0041 東京都渋谷区神南１丁目７−３", "日本"))).toBe(
      "東京都渋谷区神南１丁目７−３",
    );
  });
});
