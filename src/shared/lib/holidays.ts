import * as years from "@hyunbinseo/holidays-kr/all";

/**
 * 대한민국 공휴일 (관보 · 월력요항 기준, @hyunbinseo/holidays-kr).
 * 패키지가 담은 해(지금은 2018~2027)만 안다. 그 밖의 해는 공휴일이 없는 것으로 본다.
 * 다음 해 데이터는 패키지 업데이트로 들어온다.
 */
const HOLIDAYS: Readonly<Record<string, readonly string[]>> = Object.assign(
  {},
  ...Object.values(years),
);

/** 날짜(yyyy-MM-dd)의 공휴일 이름들. 공휴일이 아니면 null. */
export function holidayNames(date: string): readonly string[] | null {
  return HOLIDAYS[date] ?? null;
}

export function isHoliday(date: string): boolean {
  return date in HOLIDAYS;
}
