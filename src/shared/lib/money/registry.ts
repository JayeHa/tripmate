/**
 * 앱이 아는 통화 — 통화 고르기 · 「다른 통화 추가」 · 이름 · 소수 자릿수 · 처음 환율이 모두 이 목록을 쓴다.
 * perKrw 는 1단위가 원으로 얼마인지 대략 적은 **고정 값**이다(2026-10 기준). 실시간 환율이 아니라서 추가한 뒤
 * 환율을 확인해 고치게 한다(사용자 결정, 2026-10-07). 같은 이름(달러 · 크로네 · 페소 · 루피)은 나라를 붙여 가린다
 */
export type CurrencyInfo = {
  code: string;
  country: string;
  /** 금액 옆 단위 · 「엔 920 기준」 에 쓰는 이름 */
  name: string;
  /** 1단위 = 원 얼마(대략) */
  perKrw: number;
  /** 소수 자릿수 — 원 · 엔처럼 소수를 안 쓰는 통화는 0 */
  decimals: number;
};

/** [나라, 코드, 이름, 1단위의 원, 소수 자릿수] — 대한민국 · 일본 · 미국 먼저, 그 밖은 나라 이름 순 */
const TABLE: [string, string, string, number, number][] = [
  ["대한민국", "KRW", "원", 1, 0],
  ["일본", "JPY", "엔", 9.2, 0],
  ["미국", "USD", "달러", 1400, 2],
  ["가나", "GHS", "세디", 90, 2],
  ["과테말라", "GTQ", "케트살", 180, 2],
  ["유럽연합", "EUR", "유로", 1500, 2],
  ["나이지리아", "NGN", "나이라", 0.9, 2],
  ["남아프리카 공화국", "ZAR", "란드", 78, 2],
  ["네팔", "NPR", "네팔 루피", 10, 2],
  ["노르웨이", "NOK", "노르웨이 크로네", 130, 2],
  ["뉴질랜드", "NZD", "뉴질랜드 달러", 830, 2],
  ["대만", "TWD", "대만 달러", 43, 0],
  ["덴마크", "DKK", "덴마크 크로네", 200, 2],
  ["라오스", "LAK", "킵", 0.064, 0],
  ["러시아", "RUB", "루블", 15, 2],
  ["말레이시아", "MYR", "링깃", 310, 2],
  ["멕시코", "MXN", "멕시코 페소", 75, 2],
  ["몽골", "MNT", "투그릭", 0.4, 0],
  ["베트남", "VND", "동", 0.055, 0],
  ["브라질", "BRL", "헤알", 250, 2],
  ["스위스", "CHF", "프랑", 1700, 2],
  ["스웨덴", "SEK", "크로나", 130, 2],
  ["싱가포르", "SGD", "싱가포르 달러", 1060, 2],
  ["아랍에미리트", "AED", "디르함", 380, 2],
  ["영국", "GBP", "파운드", 1820, 2],
  ["인도", "INR", "인도 루피", 16.5, 2],
  ["인도네시아", "IDR", "루피아", 0.086, 0],
  ["중국", "CNY", "위안", 192, 2],
  ["체코", "CZK", "코루나", 60, 2],
  ["캐나다", "CAD", "캐나다 달러", 1010, 2],
  ["캄보디아", "KHR", "리엘", 0.34, 0],
  ["태국", "THB", "바트", 41, 2],
  ["튀르키예", "TRY", "리라", 40, 2],
  ["필리핀", "PHP", "필리핀 페소", 24, 2],
  ["호주", "AUD", "호주 달러", 910, 2],
  ["홍콩", "HKD", "홍콩 달러", 178, 2],
];

export const CURRENCIES: CurrencyInfo[] = TABLE.map(([country, code, name, perKrw, decimals]) => ({
  code,
  country,
  name,
  perKrw,
  decimals,
}));

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

/** 통화 정보. 목록에 없는 통화(옛 데이터)는 undefined */
export function currencyInfo(code: string): CurrencyInfo | undefined {
  return BY_CODE.get(code);
}

/**
 * 「다른 통화 추가」 의 처음 환율 — 고정 값(원 기준)을 이 여행의 기준 화폐로 바꾼다.
 * 1단위가 기준 화폐 1 보다 작으면 100 단위로 적는다(100동 = 5.5원). 엔은 「100엔」 이 익숙해 늘 100 단위.
 * 두 통화 중 하나라도 목록에 없으면 null(사용자가 직접 넣는다)
 */
export function defaultRate(code: string, home: string): { unit: number; value: number } | null {
  const c = currencyInfo(code);
  const h = currencyInfo(home);
  if (!c || !h) return null;
  const perHome = c.perKrw / h.perKrw;
  const unit = code === "JPY" || perHome < 1 ? 100 : 1;
  return { unit, value: Number((perHome * unit).toPrecision(6)) };
}

/** 검색 — 나라 · 통화 이름은 들어 있으면, 코드는 대소문자 없이. 빈 검색은 전체 */
export function searchCurrencies(query: string): CurrencyInfo[] {
  const q = query.trim();
  if (!q) return CURRENCIES;
  const upper = q.toUpperCase();
  return CURRENCIES.filter(
    (c) => c.country.includes(q) || c.name.includes(q) || c.code.includes(upper),
  );
}
