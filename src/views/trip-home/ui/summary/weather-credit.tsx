/**
 * 날씨 데이터의 출처 — Open-Meteo 무료 API 는 CC BY 4.0 이라 쓰는 곳에 출처 링크를 둔다.
 * 날씨 타일을 보일 때만 그린다
 * @see https://open-meteo.com/en/license
 */
export function WeatherCredit() {
  return (
    <a
      href="https://open-meteo.com/"
      target="_blank"
      rel="noreferrer"
      className="text-[11px] text-ink-350 hover:underline"
    >
      Weather data by Open-Meteo.com
    </a>
  );
}
