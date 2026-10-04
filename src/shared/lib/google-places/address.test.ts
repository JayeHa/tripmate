import { describe, expect, it } from "vitest";

import {
  cleanAddress,
  type GeocodeResult,
  koreanAddress,
  localLanguage,
  pickGeocode,
} from "./address";

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

/** 구성 요소 이름 · 첫 타입 목록으로 결과 하나 */
function result(formatted: string, types: string[], comps: [string, string][]): GeocodeResult {
  return {
    formatted_address: formatted,
    types,
    address_components: comps.map(([long_name, type]) => ({ long_name, types: [type] })),
  };
}

/** 시부야 진난 1-22-7 역지오코딩(한국어 요청) 응답에서 쓰는 결과들 — 2026-10-05 실제 응답 */
const STREET = result(
  "1-chōme-22-7 Jinnan, Shibuya, Tokyo 150-0041 일본",
  ["premise", "street_address"],
  [
    ["7", "premise"],
    ["22", "political"],
    ["1-chōme", "political"],
    ["Jinnan", "political"],
    ["Shibuya", "locality"],
    ["Tokyo", "administrative_area_level_1"],
    ["일본", "country"],
    ["150-0041", "postal_code"],
  ],
);
const CHOME = result(
  "일본 〒150-0041 도쿄도 시부야구 진난 1 조메",
  ["political", "sublocality"],
  [
    ["1 조메", "political"],
    ["진난", "political"],
    ["시부야구", "locality"],
    ["도쿄도", "administrative_area_level_1"],
    ["일본", "country"],
    ["150-0041", "postal_code"],
  ],
);
const WARD = result(
  "일본 도쿄도 시부야구",
  ["locality", "political"],
  [
    ["시부야구", "locality"],
    ["도쿄도", "administrative_area_level_1"],
    ["일본", "country"],
  ],
);
/** 로마자 동네 결과 — 나라 이름만 한글이다 */
const ROMAN_CHOME = result(
  "1 Chome-22 Jinnan, Shibuya, Tokyo 150-0041 일본",
  ["political", "sublocality"],
  [
    ["22", "political"],
    ["1 Chome", "political"],
    ["Jinnan", "political"],
    ["Shibuya", "locality"],
    ["Tokyo", "administrative_area_level_1"],
    ["일본", "country"],
    ["150-0041", "postal_code"],
  ],
);
const PLUS = result("MP62+CC 일본 도쿄도 시부야구", ["plus_code"], [["MP62+CC", "plus_code"]]);

describe("koreanAddress", () => {
  it("한글 동네 이름 뒤에 번지 숫자를 붙인다", () => {
    expect(koreanAddress([STREET, PLUS, ROMAN_CHOME, CHOME, WARD], STREET)).toBe(
      "도쿄도 시부야구 진난 1 조메 22-7",
    );
  });

  it("한글 결과가 구 단위뿐이면 숫자 없이, 없으면 null", () => {
    expect(koreanAddress([STREET, PLUS, WARD], STREET)).toBe("도쿄도 시부야구");
    expect(koreanAddress([STREET, PLUS], STREET)).toBeNull();
  });

  it("번지 주소가 이미 한글이면(한국) null", () => {
    const seoul = result(
      "대한민국 서울특별시 중구 세종대로 110",
      ["street_address"],
      [["대한민국", "country"]],
    );
    expect(koreanAddress([seoul], seoul)).toBeNull();
  });
});
