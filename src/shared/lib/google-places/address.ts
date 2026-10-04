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

/** 한글이 들어 있는지 */
const HANGUL = /[가-힣]/;

/**
 * 한글 주소. 구글은 일본 등 해외 번지 주소를 한국어로 요청해도 로마자로 주지만, 동네 단위(sublocality) 결과는 한글로 준다
 * (「도쿄도 시부야구 진난 1 조메」). 그 뒤에 번지 결과에만 있는 숫자(「22-7」)를 붙인다.
 * 번지 결과가 한글 결과보다 앞(더 자세한 쪽)에 가진 구성 요소 중 숫자만 — 「7 · 22」 를 거꾸로 이어 「22-7」.
 * 한글 결과가 동네 단위가 아니면(구 · 시까지만) 숫자를 붙이지 않는다 — 사이 동네 이름이 빠진 채 번지만 붙게 된다.
 * 한글 결과가 없거나 번지 주소가 이미 한글이면(한국) null — 같은 줄을 두 번 보이지 않게.
 */
export function koreanAddress(
  results: GeocodeResult[],
  street: GeocodeResult | null,
): string | null {
  if (street && HANGUL.test(cleanAddress(street))) return null;
  // 나라 이름(「일본」)은 로마자 결과에도 한글로 붙어 오므로 나라 · 우편번호를 뺀 뒤에 본다
  const ko = results.find((r) => r.types.includes("political") && HANGUL.test(cleanAddress(r)));
  if (!ko) return null;
  const line = cleanAddress(ko);
  if (!street || !ko.types.includes("sublocality")) return line;
  const extra = street.address_components.length - ko.address_components.length;
  const numbers = street.address_components
    .slice(0, Math.max(0, extra))
    .map((c) => c.long_name)
    .filter((n) => /^[\d-]+$/.test(n))
    .reverse();
  return numbers.length > 0 ? `${line} ${numbers.join("-")}` : line;
}
