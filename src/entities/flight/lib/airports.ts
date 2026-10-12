/** 공항 — IATA 코드(3자리) · 이름 · 도시 · 시간대(IANA, 소요 시간 계산) */
export type Airport = { code: string; name: string; city: string; tz: string };

/** 공항 목록 — 국내 공항과 한국발 노선이 많은 아시아 공항. 없는 공항은 코드를 직접 넣는다(airportFromCode) */
export const AIRPORTS: readonly Airport[] = [
  { code: "ICN", name: "인천국제공항", city: "서울/인천", tz: "Asia/Seoul" },
  { code: "GMP", name: "김포국제공항", city: "서울", tz: "Asia/Seoul" },
  { code: "PUS", name: "김해국제공항", city: "부산", tz: "Asia/Seoul" },
  { code: "CJU", name: "제주국제공항", city: "제주", tz: "Asia/Seoul" },
  { code: "TAE", name: "대구국제공항", city: "대구", tz: "Asia/Seoul" },
  { code: "CJJ", name: "청주국제공항", city: "청주", tz: "Asia/Seoul" },
  { code: "MWX", name: "무안국제공항", city: "무안", tz: "Asia/Seoul" },
  { code: "YNY", name: "양양국제공항", city: "양양", tz: "Asia/Seoul" },
  { code: "NRT", name: "나리타국제공항", city: "도쿄", tz: "Asia/Tokyo" },
  { code: "HND", name: "하네다공항", city: "도쿄", tz: "Asia/Tokyo" },
  { code: "KIX", name: "간사이국제공항", city: "오사카", tz: "Asia/Tokyo" },
  { code: "ITM", name: "이타미공항", city: "오사카", tz: "Asia/Tokyo" },
  { code: "NGO", name: "주부국제공항", city: "나고야", tz: "Asia/Tokyo" },
  { code: "FUK", name: "후쿠오카공항", city: "후쿠오카", tz: "Asia/Tokyo" },
  { code: "CTS", name: "신치토세공항", city: "삿포로", tz: "Asia/Tokyo" },
  { code: "OKA", name: "나하공항", city: "오키나와", tz: "Asia/Tokyo" },
  { code: "KOJ", name: "가고시마공항", city: "가고시마", tz: "Asia/Tokyo" },
  { code: "KMJ", name: "구마모토공항", city: "구마모토", tz: "Asia/Tokyo" },
  { code: "OIT", name: "오이타공항", city: "오이타", tz: "Asia/Tokyo" },
  { code: "KKJ", name: "기타큐슈공항", city: "기타큐슈", tz: "Asia/Tokyo" },
  { code: "MYJ", name: "마쓰야마공항", city: "마쓰야마", tz: "Asia/Tokyo" },
  { code: "TAK", name: "다카마쓰공항", city: "다카마쓰", tz: "Asia/Tokyo" },
  { code: "HIJ", name: "히로시마공항", city: "히로시마", tz: "Asia/Tokyo" },
  { code: "KIJ", name: "니가타공항", city: "니가타", tz: "Asia/Tokyo" },
  { code: "SDJ", name: "센다이공항", city: "센다이", tz: "Asia/Tokyo" },
  { code: "TPE", name: "타오위안국제공항", city: "타이베이", tz: "Asia/Taipei" },
  { code: "TSA", name: "쑹산공항", city: "타이베이", tz: "Asia/Taipei" },
  { code: "KHH", name: "가오슝국제공항", city: "가오슝", tz: "Asia/Taipei" },
  { code: "RMQ", name: "타이중국제공항", city: "타이중", tz: "Asia/Taipei" },
  { code: "HKG", name: "홍콩국제공항", city: "홍콩", tz: "Asia/Hong_Kong" },
  { code: "MFM", name: "마카오국제공항", city: "마카오", tz: "Asia/Macau" },
  { code: "PEK", name: "베이징 서우두국제공항", city: "베이징", tz: "Asia/Shanghai" },
  { code: "PKX", name: "베이징 다싱국제공항", city: "베이징", tz: "Asia/Shanghai" },
  { code: "PVG", name: "상하이 푸둥국제공항", city: "상하이", tz: "Asia/Shanghai" },
  { code: "SHA", name: "상하이 훙차오국제공항", city: "상하이", tz: "Asia/Shanghai" },
  { code: "TAO", name: "칭다오 자오둥국제공항", city: "칭다오", tz: "Asia/Shanghai" },
  { code: "DLC", name: "다롄국제공항", city: "다롄", tz: "Asia/Shanghai" },
  { code: "BKK", name: "수완나품국제공항", city: "방콕", tz: "Asia/Bangkok" },
  { code: "DMK", name: "돈므앙국제공항", city: "방콕", tz: "Asia/Bangkok" },
  { code: "CNX", name: "치앙마이국제공항", city: "치앙마이", tz: "Asia/Bangkok" },
  { code: "HKT", name: "푸껫국제공항", city: "푸껫", tz: "Asia/Bangkok" },
  { code: "SGN", name: "떤선녓국제공항", city: "호찌민", tz: "Asia/Ho_Chi_Minh" },
  { code: "HAN", name: "노이바이국제공항", city: "하노이", tz: "Asia/Ho_Chi_Minh" },
  { code: "DAD", name: "다낭국제공항", city: "다낭", tz: "Asia/Ho_Chi_Minh" },
  { code: "CXR", name: "깜라인국제공항", city: "나트랑", tz: "Asia/Ho_Chi_Minh" },
  { code: "PQC", name: "푸꾸옥국제공항", city: "푸꾸옥", tz: "Asia/Ho_Chi_Minh" },
  { code: "SIN", name: "창이국제공항", city: "싱가포르", tz: "Asia/Singapore" },
  { code: "KUL", name: "쿠알라룸푸르국제공항", city: "쿠알라룸푸르", tz: "Asia/Kuala_Lumpur" },
  { code: "BKI", name: "코타키나발루국제공항", city: "코타키나발루", tz: "Asia/Kuching" },
  { code: "MNL", name: "니노이아키노국제공항", city: "마닐라", tz: "Asia/Manila" },
  { code: "CEB", name: "막탄세부국제공항", city: "세부", tz: "Asia/Manila" },
  { code: "CGK", name: "수카르노하타국제공항", city: "자카르타", tz: "Asia/Jakarta" },
  { code: "DPS", name: "응우라라이국제공항", city: "발리", tz: "Asia/Makassar" },
  { code: "GUM", name: "괌국제공항", city: "괌", tz: "Pacific/Guam" },
  { code: "SPN", name: "사이판국제공항", city: "사이판", tz: "Pacific/Saipan" },
  { code: "ULN", name: "칭기즈칸국제공항", city: "울란바토르", tz: "Asia/Ulaanbaatar" },
];

/** 코드 · 이름 · 도시로 찾는다(대소문자 무시) */
export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...AIRPORTS];
  return AIRPORTS.filter(
    (a) => a.code.toLowerCase().includes(q) || a.name.includes(q) || a.city.includes(q),
  );
}

/** 코드의 공항. 목록에 없으면(직접 넣은 코드) null */
export function airportOf(code: string): Airport | null {
  return AIRPORTS.find((a) => a.code === code) ?? null;
}

/** 직접 넣은 코드 — 영문 3자리면 대문자 코드, 아니면 null */
export function airportFromCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}
