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
  address_components: { long_name: string; short_name?: string; types: string[] }[];
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
  const names = (type: string) =>
    result.address_components.filter((c) => c.types.includes(type)).map((c) => c.long_name);
  let text = ` ${result.formatted_address} `;
  for (const postal of names("postal_code")) text = text.split(postal).join(" ");
  text = text.replace(/〒/g, " ");
  // 나라 이름은 맨 앞 · 맨 끝에 있을 때만 뺀다 — 「Ciudad de México, CDMX, México」 의 도시 이름 안 México 는 둔다
  for (const country of names("country")) {
    text = trimSeparators(text);
    if (text.startsWith(country)) text = text.slice(country.length);
    if (text.endsWith(country)) text = text.slice(0, -country.length);
  }
  return trimSeparators(text.replace(/\s+([,、])/g, "$1").replace(/\s{2,}/g, " "));
}

/** 앞뒤 공백 · 쉼표 · 「、」 를 뗀다 */
function trimSeparators(text: string): string {
  return text.replace(/^[\s,、]+|[\s,、]+$/g, "");
}

/** 한글이 들어 있는지 */
const HANGUL = /[가-힣]/;

/** 구성 요소의 동네 단계(sublocality_level_N 의 N). 없으면 null */
function sublocalityLevel(types: string[]): number | null {
  const level = types.map((t) => /^sublocality_level_(\d)$/.exec(t)?.[1]).find(Boolean);
  return level ? Number(level) : null;
}

/** 번지 결과의 나라 코드(나라 구성 요소의 짧은 이름 — 「JP」 · 「KR」). 없으면 null */
function countryOf(result: GeocodeResult): string | null {
  return result.address_components.find((c) => c.types.includes("country"))?.short_name ?? null;
}

/** 번지 결과에서 한글 동네(단계 level)보다 자세한 칸 중 숫자만, 큰 단위부터 — 「1 조메」 뒤의 「22-7」 */
function numbersBelow(street: GeocodeResult, level: number): string[] {
  const at = street.address_components.findIndex((c) => sublocalityLevel(c.types) === level);
  if (at < 0) return [];
  return street.address_components
    .slice(0, at)
    .map((c) => c.long_name)
    .filter((n) => /^[\d-]+$/.test(n))
    .reverse();
}

/**
 * 한글 주소. 구글은 해외 번지 주소를 한국어로 요청해도 로마자로 주고, 동네 단위(sublocality) 결과만 한글로 준다
 * (「도쿄도 시부야구 진난 1 조메」). 한글 결과가 없거나 한국 주소면 null — 번지 주소가 곧 한글이라 같은 줄을 두 번 보이지 않게.
 * 한국인지는 나라 코드로 본다 — 해외 번지 주소에도 건물 이름이 한글로 섞여 온다(「… 1-chōme−10−10 우사기야 빌딩」).
 * **일본만** 그 뒤에 번지 숫자를 붙인다. 한글 결과의 가장 자세한 동네 단계와 같은 단계를 번지 결과에서 찾아 그보다 자세한 숫자만
 * 붙이고(「1 조메」 = level 3 → 「22 · 7」), 한글 결과가 조메(level 3)보다 덜 자세하면 붙이지 않는다 — 「진난 22-7」 처럼
 * 조메가 빠진 틀린 주소가 된다. 다른 나라는 도로명 · 번지 구조가 달라 한글 동네 이름만 둔다.
 */
export function koreanAddress(
  results: GeocodeResult[],
  street: GeocodeResult | null,
): string | null {
  if (street && countryOf(street) === "KR") return null;
  // 나라 이름(「일본」)은 로마자 결과에도 한글로 붙어 오므로 나라 · 우편번호를 뺀 뒤에 본다
  const ko = results.find((r) => r.types.includes("political") && HANGUL.test(cleanAddress(r)));
  if (!ko) return null;
  const line = cleanAddress(ko);
  const level = sublocalityLevel(ko.address_components[0]?.types ?? []);
  if (!street || countryOf(street) !== "JP" || level === null || level < 3) return line;
  const numbers = numbersBelow(street, level);
  return numbers.length > 0 ? `${line} ${numbers.join("-")}` : line;
}
