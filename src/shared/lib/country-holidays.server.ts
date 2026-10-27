import "server-only";

import Holidays from "date-holidays";

import { type CountryHoliday, toCountryHolidays } from "./country-holidays";

/**
 * 그 나라 그 해의 공휴일(이름은 영어) — date-holidays 를 부르는 곳은 여기 하나다.
 * 데이터가 커서(압축 약 290KB) 화면 번들에 넣지 않고 서버 라우트에서만 쓴다. 데이터가 없는 나라(MV · MP · MN · MM · LA)는 빈 목록
 * @see https://github.com/commenthol/date-holidays
 */
export function publicHolidays(country: string, year: number): CountryHoliday[] {
  return toCountryHolidays(new Holidays(country).getHolidays(year, "en"));
}
