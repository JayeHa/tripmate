/**
 * 나라 코드 → 현지어 주소를 받을 언어. 한국은 한국어 주소가 곧 현지어라 없다.
 * 영어권은 「en」 — 한국어로 요청한 주소가 한글 음역일 때 원래 표기를 함께 보이려고.
 * 목록에 없는 나라는 현지어 줄을 두지 않는다(벨기에처럼 언어가 갈리는 곳 포함).
 */
const LOCAL_LANGUAGE: Record<string, string> = {
  JP: "ja",
  CN: "zh-CN",
  TW: "zh-TW",
  HK: "zh-HK",
  VN: "vi",
  TH: "th",
  LA: "lo",
  MM: "my",
  MN: "mn",
  ID: "id",
  RU: "ru",
  KZ: "ru",
  TR: "tr",
  GR: "el",
  ES: "es",
  MX: "es",
  PT: "pt",
  FR: "fr",
  IT: "it",
  DE: "de",
  AT: "de",
  CH: "de",
  NL: "nl",
  CZ: "cs",
  HU: "hu",
  HR: "hr",
  FI: "fi",
  US: "en",
  GB: "en",
  AU: "en",
  NZ: "en",
  CA: "en",
  SG: "en",
  PH: "en",
  MY: "en",
  GU: "en",
  MP: "en",
};

/** 현지어 주소를 받을 언어. 없으면(한국 · 목록 밖) null */
export function localLanguage(countryCode: string): string | null {
  return LOCAL_LANGUAGE[countryCode.toUpperCase()] ?? null;
}

/** 역지오코딩 결과 하나에서 쓰는 칸만(google.maps.GeocoderResult 와 같은 모양) */
export type GeocodeResult = {
  formatted_address: string;
  types: string[];
  address_components: { long_name: string; types: string[] }[];
};

/**
 * 역지오코딩 결과 중 핀 위치를 가장 잘 말하는 주소. 번지(street_address · premise)를 먼저 고르고,
 * 없으면 plus code(「8Q7X+…」)가 아닌 첫 결과. 첫 결과는 근처 가게(POI)일 때가 많아 번지를 우선한다.
 */
export function pickGeocode(results: GeocodeResult[]): GeocodeResult | null {
  return (
    results.find((r) => r.types.includes("street_address") || r.types.includes("premise")) ??
    results.find((r) => !r.types.includes("plus_code")) ??
    null
  );
}

/**
 * 주소 한 줄로 정리한다 — 나라 이름 · 우편번호 · 「〒」 를 빼고 앞뒤 구분자를 다듬는다.
 * 「1-chōme-7-3 Jinnan, Shibuya, Tokyo 150-0041 일본」 → 「1-chōme-7-3 Jinnan, Shibuya, Tokyo」,
 * 「日本、〒150-0041 東京都渋谷区神南１丁目７−３」 → 「東京都渋谷区神南１丁目７−３」
 */
export function cleanAddress(result: GeocodeResult): string {
  const drop = result.address_components
    .filter((c) => c.types.includes("country") || c.types.includes("postal_code"))
    .map((c) => c.long_name);
  let text = result.formatted_address;
  for (const part of drop) text = text.split(part).join(" ");
  return text
    .replace(/〒/g, " ")
    .replace(/\s+([,、])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,、]+|[\s,、]+$/g, "");
}
