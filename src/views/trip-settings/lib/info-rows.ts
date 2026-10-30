import { format, parseISO } from "date-fns";

import type { Trip } from "@/entities/trip";
import { nightsLabel } from "@/shared/lib/date-field";
import { displayRateValue } from "@/shared/lib/money";

/** 여행 정보 줄 이름 — 이름 · 도시 · 기간은 누르면 홈 「편집」 과 같은 창이 열린다 */
export type InfoKey = "title" | "cities" | "dates" | "home" | "rates";

/** 여행 정보 한 줄 — empty 면 값이 회색(「없음」) */
export type InfoRow = { key: InfoKey; label: string; value: string; empty: boolean };

/** 「2026.10.31 – 11.04 · 4박 5일」. 해가 바뀌면 끝에도 연도, 같은 날이면 「당일」 */
export function periodLabel(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const range = `${format(parseISO(start), "yyyy.MM.dd")} – ${format(parseISO(end), sameYear ? "MM.dd" : "yyyy.MM.dd")}`;
  return `${range} · ${start === end ? "당일" : nightsLabel(start, end)}`;
}

/** 여행 환율 줄마다 「100 JPY = 920 KRW」. 저장값의 반올림 끝자리는 보이지 않게 */
export function rateLines(trip: Pick<Trip, "exchange_rates" | "home_currency">): string[] {
  return Object.entries(trip.exchange_rates).map(
    ([code, r]) =>
      `${r.unit.toLocaleString("ko-KR")} ${code} = ${displayRateValue(r.value).toLocaleString("ko-KR")} ${trip.home_currency}`,
  );
}

/** 설정의 여행 정보 표 — 이름 · 도시 · 기간 · 기준 화폐 · 환율. 도시를 아직 못 읽었으면 빈 값 */
export function infoRows(trip: Trip, cityNames: string[] | undefined): InfoRow[] {
  const rates = rateLines(trip);
  return [
    { key: "title", label: "여행 이름", value: trip.title, empty: false },
    { key: "cities", label: "도시", value: cityNames?.join(" · ") ?? "", empty: false },
    {
      key: "dates",
      label: "기간",
      value: periodLabel(trip.start_date, trip.end_date),
      empty: false,
    },
    { key: "home", label: "기준 화폐", value: trip.home_currency, empty: false },
    {
      key: "rates",
      label: "환율",
      value: rates.length > 0 ? rates.join("\n") : "없음",
      empty: rates.length === 0,
    },
  ];
}
