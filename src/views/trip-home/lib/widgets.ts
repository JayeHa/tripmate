import type { CountryHoliday } from "@/shared/lib/country-holidays";
import { dayCount, dayLabel, dayParts } from "@/shared/lib/days";
import {
  currencyName,
  decimalsOf,
  type ExchangeRates,
  formatMoney,
  roundTo,
} from "@/shared/lib/money";

/** 위젯 타일 한 칸 — 라벨 · 큰 값 · 아래 보조. 공휴일은 보조 글(이름)을 빨갛게 */
export type WidgetTile = {
  key: "rate" | "holiday" | "time";
  label: string;
  main: string;
  sub: string;
  holiday?: true;
};

/** 시차를 재는 기준 — 한국 */
const KOREA = "Asia/Seoul";

/** 그 시간대의 벽시계를 분 단위 수로 — 두 시간대의 차가 곧 시차다 */
function wallMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute")) / 60_000;
}

/** 그 시간대가 한국보다 몇 분 빠른지(느리면 음수) — 서머타임도 그 시각 기준으로 */
export function offsetFromKorea(timeZone: string, at: Date): number {
  return wallMinutes(timeZone, at) - wallMinutes(KOREA, at);
}

/** 「한국보다 1시간 빠름」 · 「한국보다 2시간 30분 느림」 · 「한국과 같음」 */
export function offsetLabel(minutes: number): string {
  if (minutes === 0) return "한국과 같음";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const span = [h && `${h}시간`, m && `${m}분`].filter(Boolean).join(" ");
  return `한국보다 ${span} ${minutes > 0 ? "빠름" : "느림"}`;
}

/** 그 시간대의 지금 시각 「14:32」 */
export function localTimeText(timeZone: string, at: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

/**
 * 공휴일 타일 — 여행 기간 안의 공휴일(받은 목록)로. 여행 전에는 첫 공휴일의 날짜(「11.3 (화)」 · 이름),
 * 여행 중에는 오늘부터 다음 공휴일까지 남은 날(「D-2」 · 「11.3 Culture Day」, 오늘이면 「오늘」). 남은 공휴일이 없으면 null
 */
export function holidayTile(
  holidays: readonly CountryHoliday[],
  start: string,
  today: string,
): WidgetTile | null {
  const base = { key: "holiday", label: "공휴일", holiday: true } as const;
  if (today < start) {
    const first = holidays[0];
    return first ? { ...base, main: dayLabel(first.date, 0), sub: first.name } : null;
  }
  const next = holidays.find((h) => h.date >= today);
  if (!next) return null;
  const left = dayCount(today, next.date) - 1;
  return {
    ...base,
    main: left === 0 ? "오늘" : `D-${left}`,
    sub: `${dayParts(next.date, 0).date} ${next.name}`,
  };
}

/** 위젯을 정하는 데 필요한 것 — 여행지(첫 도시)의 통화 · 시간대와 여행 환율 */
export type WidgetSource = {
  currency: string;
  timeZone: string;
  home: string;
  rates: ExchangeRates;
  at: Date;
  /** 실시간 환율 — 여행 환율과 같은 단위의 기준 화폐 금액(「지금 905」). 모르면 null */
  live: number | null;
  /** 여행 기간 안의 여행지 공휴일 — 받기 전이면 undefined */
  holidays: readonly CountryHoliday[] | undefined;
  /** 여행 시작일 · 오늘(yyyy-MM-dd) */
  start: string;
  today: string;
};

/**
 * 위젯 줄의 타일 — 환율(여행지 통화가 기준 화폐와 다르고 여행 환율이 있을 때) · 공휴일(남은 기간에 있을 때) · 현지 시간(한국과 시차가 있을 때).
 * 환율 큰 값은 그 단위의 기준 화폐 금액(「₩920」), 아래는 단위와 실시간 값(「100엔 · 지금 905」, 모르면 단위만)
 */
export function widgetTiles(src: WidgetSource): WidgetTile[] {
  const tiles: WidgetTile[] = [];
  const rate = src.rates[src.currency];
  if (src.currency !== src.home && rate) {
    tiles.push({
      key: "rate",
      label: "환율",
      main: formatMoney(rate.value, src.home),
      sub: [
        `${rate.unit.toLocaleString("ko-KR")}${currencyName(src.currency)}`,
        src.live === null
          ? null
          : `지금 ${roundTo(src.live, decimalsOf(src.home)).toLocaleString("ko-KR")}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  const holiday = src.holidays && holidayTile(src.holidays, src.start, src.today);
  if (holiday) tiles.push(holiday);
  const offset = offsetFromKorea(src.timeZone, src.at);
  if (offset !== 0) {
    tiles.push({
      key: "time",
      label: "현지 시간",
      main: localTimeText(src.timeZone, src.at),
      sub: offsetLabel(offset),
    });
  }
  return tiles;
}
