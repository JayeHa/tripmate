/** 항공사 — 이름 · IATA 코드(2자리) */
export type Airline = { name: string; code: string };

/**
 * 항공사 목록 — 국내 항공사와 한국발 노선이 많은 아시아 항공사. 자주 고르는 순(앞 8개가 검색 전에 보인다).
 * 없는 항공사는 코드를 직접 넣는다(airlineFromCode)
 */
export const AIRLINES: readonly Airline[] = [
  { name: "대한항공", code: "KE" },
  { name: "아시아나항공", code: "OZ" },
  { name: "제주항공", code: "7C" },
  { name: "진에어", code: "LJ" },
  { name: "티웨이항공", code: "TW" },
  { name: "에어서울", code: "RS" },
  { name: "에어부산", code: "BX" },
  { name: "이스타항공", code: "ZE" },
  { name: "에어프레미아", code: "YP" },
  { name: "에어로케이", code: "RF" },
  { name: "일본항공", code: "JL" },
  { name: "전일본공수", code: "NH" },
  { name: "피치항공", code: "MM" },
  { name: "집에어", code: "ZG" },
  { name: "스카이마크", code: "BC" },
  { name: "제트스타 재팬", code: "GK" },
  { name: "중화항공", code: "CI" },
  { name: "에바항공", code: "BR" },
  { name: "스타럭스항공", code: "JX" },
  { name: "타이거에어 타이완", code: "IT" },
  { name: "캐세이퍼시픽", code: "CX" },
  { name: "홍콩익스프레스", code: "UO" },
  { name: "중국국제항공", code: "CA" },
  { name: "중국동방항공", code: "MU" },
  { name: "중국남방항공", code: "CZ" },
  { name: "춘추항공", code: "9C" },
  { name: "타이항공", code: "TG" },
  { name: "베트남항공", code: "VN" },
  { name: "비엣젯항공", code: "VJ" },
  { name: "싱가포르항공", code: "SQ" },
  { name: "필리핀항공", code: "PR" },
  { name: "세부퍼시픽", code: "5J" },
  { name: "에어아시아", code: "AK" },
  { name: "말레이시아항공", code: "MH" },
  { name: "가루다인도네시아", code: "GA" },
  { name: "에어마카오", code: "NX" },
];

/** 이름 · 코드로 찾는다(대소문자 무시). 빈 검색어면 앞 8개, 아니면 14개까지 */
export function searchAirlines(query: string): Airline[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRLINES.slice(0, 8);
  return AIRLINES.filter(
    (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q),
  ).slice(0, 14);
}

/**
 * 직접 넣은 코드 — 2자리 영문 · 숫자면 그 항공사(목록에 있으면 목록 이름, 없으면 코드가 이름), 아니면 null
 */
export function airlineFromCode(input: string): Airline | null {
  const code = input.trim().toUpperCase();
  if (!/^[A-Z0-9]{2}$/.test(code)) return null;
  return AIRLINES.find((a) => a.code === code) ?? { name: code, code };
}
