/**
 * 공휴일 데이터의 출처 — date-holidays 의 공휴일 데이터는 CC BY 3.0 이라 쓰는 곳에 출처와 라이선스를 적는다.
 * 공휴일 타일을 보일 때만 그린다
 * @see https://github.com/commenthol/date-holidays#license
 */
export function HolidayCredit() {
  return (
    <a
      href="https://github.com/commenthol/date-holidays"
      target="_blank"
      rel="noreferrer"
      className="text-[11px] text-ink-350 hover:underline"
    >
      Holidays by date-holidays (CC BY 3.0)
    </a>
  );
}
