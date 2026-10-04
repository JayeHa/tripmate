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
  it("나라 이름은 맨 앞 · 맨 끝에서만 뺀다(도시 이름 안의 나라 이름은 둔다)", () => {
    const mexico = result(
      "06600 Ciudad de México, CDMX, México",
      ["street_address"],
      [
        ["México", "country,political", "MX"],
        ["06600", "postal_code"],
      ],
    );
    expect(cleanAddress(mexico)).toBe("Ciudad de México, CDMX");
  });

  it("나라 이름 · 우편번호 · 〒 를 빼고 구분자를 다듬는다", () => {
    expect(cleanAddress(shibuya("1-chōme-7-3 Jinnan, Shibuya, Tokyo 150-0041 일본", "일본"))).toBe(
      "1-chōme-7-3 Jinnan, Shibuya, Tokyo",
    );
    expect(cleanAddress(shibuya("日本、〒150-0041 東京都渋谷区神南１丁目７−３", "日本"))).toBe(
      "東京都渋谷区神南１丁目７−３",
    );
  });
});

/** 구성 요소 [이름, 타입(쉼표로 이음), 짧은 이름] 목록으로 결과 하나 */
function result(
  formatted: string,
  types: string[],
  comps: [string, string, string?][],
): GeocodeResult {
  return {
    formatted_address: formatted,
    types,
    address_components: comps.map(([long_name, t, short_name]) => ({
      long_name,
      short_name: short_name ?? long_name,
      types: t.split(","),
    })),
  };
}

const JAPAN: [string, string, string] = ["일본", "country,political", "JP"];
const POSTAL: [string, string] = ["150-0041", "postal_code"];

/** 시부야 진난 1-22-7 역지오코딩(한국어 요청) 응답에서 쓰는 결과들 — 2026-10-05 실제 응답의 구성 요소 */
const STREET = result(
  "1-chōme-22-7 Jinnan, Shibuya, Tokyo 150-0041 일본",
  ["premise", "street_address"],
  [
    ["7", "premise"],
    ["22", "political,sublocality,sublocality_level_4"],
    ["1-chōme", "political,sublocality,sublocality_level_3"],
    ["Jinnan", "political,sublocality,sublocality_level_2"],
    ["Shibuya", "locality,political"],
    ["Tokyo", "administrative_area_level_1,political"],
    JAPAN,
    POSTAL,
  ],
);
/** 로마자 동네 결과 — 나라 이름만 한글이다 */
const ROMAN_CHOME = result(
  "1 Chome-22 Jinnan, Shibuya, Tokyo 150-0041 일본",
  ["political", "sublocality"],
  [
    ["22", "political,sublocality,sublocality_level_4"],
    ["1 Chome", "political,sublocality,sublocality_level_3"],
    ["Jinnan", "political,sublocality,sublocality_level_2"],
    ["Shibuya", "locality,political"],
    ["Tokyo", "administrative_area_level_1,political"],
    JAPAN,
    POSTAL,
  ],
);
const CHOME = result(
  "일본 〒150-0041 도쿄도 시부야구 진난 1 조메",
  ["political", "sublocality"],
  [
    ["1 조메", "political,sublocality,sublocality_level_3"],
    ["진난", "political,sublocality,sublocality_level_2"],
    ["시부야구", "locality,political"],
    ["도쿄도", "administrative_area_level_1,political"],
    JAPAN,
    POSTAL,
  ],
);
const JINNAN = result(
  "일본 〒150-0041 도쿄도 시부야구 진난",
  ["political", "sublocality"],
  [
    ["진난", "political,sublocality,sublocality_level_2"],
    ["시부야구", "locality,political"],
    ["도쿄도", "administrative_area_level_1,political"],
    JAPAN,
    POSTAL,
  ],
);
const WARD = result(
  "일본 도쿄도 시부야구",
  ["locality", "political"],
  [["시부야구", "locality,political"], ["도쿄도", "administrative_area_level_1,political"], JAPAN],
);
const PLUS = result("MP62+CC 일본 도쿄도 시부야구", ["plus_code"], [["MP62+CC", "plus_code"]]);

describe("koreanAddress", () => {
  it("일본: 한글 동네 이름 뒤에 그보다 자세한 번지 숫자를 붙인다(로마자 동네 결과는 건너뛴다)", () => {
    expect(koreanAddress([STREET, PLUS, ROMAN_CHOME, CHOME, JINNAN, WARD], STREET)).toBe(
      "도쿄도 시부야구 진난 1 조메 22-7",
    );
  });

  it("일본: 한글 결과가 조메보다 덜 자세하면(진난 · 구) 숫자를 붙이지 않는다", () => {
    expect(koreanAddress([STREET, JINNAN, WARD], STREET)).toBe("도쿄도 시부야구 진난");
    expect(koreanAddress([STREET, PLUS, WARD], STREET)).toBe("도쿄도 시부야구");
    expect(koreanAddress([STREET, PLUS], STREET)).toBeNull();
  });

  it("일본이 아니면 번지 숫자를 붙이지 않고 한글 동네 이름만 둔다", () => {
    const vietnam: [string, string, string] = ["베트남", "country,political", "VN"];
    const vnStreet = result(
      "123 Bến Nghé, Quận 1, Hồ Chí Minh 베트남",
      ["street_address"],
      [
        ["123", "street_number"],
        ["Bến Nghé", "political,sublocality,sublocality_level_1"],
        ["Quận 1", "administrative_area_level_2,political"],
        vietnam,
      ],
    );
    const vnKo = result(
      "베트남 호찌민 1군 벤응에",
      ["political", "sublocality"],
      [
        ["벤응에", "political,sublocality,sublocality_level_1"],
        ["1군", "administrative_area_level_2,political"],
        vietnam,
      ],
    );
    expect(koreanAddress([vnStreet, vnKo], vnStreet)).toBe("호찌민 1군 벤응에");
  });

  it("번지 주소가 이미 한글이면(한국) null", () => {
    const seoul = result(
      "대한민국 서울특별시 중구 세종대로 110",
      ["street_address"],
      [["대한민국", "country,political", "KR"]],
    );
    expect(koreanAddress([seoul], seoul)).toBeNull();
  });
});
