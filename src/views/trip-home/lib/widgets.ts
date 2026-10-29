import type { CountryHoliday } from "@/shared/lib/country-holidays";
import { dayCount, dayLabel, dayParts } from "@/shared/lib/days";
import {
  currencyName,
  decimalsOf,
  type ExchangeRates,
  formatMoney,
  roundTo,
} from "@/shared/lib/money";
import type { Sky } from "@/shared/lib/weather";

/** 위젯 종류 — 이 순서가 기본 순서다 */
export const WIDGET_KEYS = ["weather", "rate", "holiday", "time"] as const;
export type WidgetKey = (typeof WIDGET_KEYS)[number];

/** 위젯 타일 한 칸 — 라벨 · 큰 값 · 아래 보조. 공휴일은 보조 글(이름)을 빨갛게, 날씨는 하늘 모양으로 아이콘을 고른다 */
export type WidgetTile = {
  key: WidgetKey;
  label: string;
  main: string;
  sub: string;
  holiday?: true;
  sky?: Sky;
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
  /** 날씨 타일 — 받기 전 · 여행이 끝났으면 null */
  weather: WidgetTile | null;
  /** 여행 기간 안의 여행지 공휴일 — 받기 전이면 undefined */
  holidays: readonly CountryHoliday[] | undefined;
  /** 여행 시작일 · 오늘(yyyy-MM-dd) */
  start: string;
  today: string;
};

/**
 * 위젯 하나 — 그릴 타일(그릴 것이 없으면 null)과, 사용자가 손대지 않았을 때 보이는지(auto).
 * auto 가 false 여도 타일이 있으면 사용자가 켜서 볼 수 있다(시차 없음 → 「한국과 같음」, 남은 공휴일 없음 → 「없음」)
 */
export type WidgetSlot = { tile: WidgetTile | null; auto: boolean };
export type WidgetSlots = Record<WidgetKey, WidgetSlot>;

/**
 * 환율 — 여행지 통화가 기준 화폐와 다르고 여행 환율이 있을 때만 그린다(없으면 켜도 보일 것이 없다).
 * 큰 값은 그 단위의 기준 화폐 금액(「₩920」), 아래는 단위와 실시간 값(「100엔 · 지금 905」, 모르면 단위만)
 */
function rateSlot(src: WidgetSource): WidgetSlot {
  const rate = src.rates[src.currency];
  if (src.currency === src.home || !rate) return { tile: null, auto: false };
  const sub = [
    `${rate.unit.toLocaleString("ko-KR")}${currencyName(src.currency)}`,
    src.live === null
      ? null
      : `지금 ${roundTo(src.live, decimalsOf(src.home)).toLocaleString("ko-KR")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const main = formatMoney(rate.value, src.home);
  return { tile: { key: "rate", label: "환율", main, sub }, auto: true };
}

/** 공휴일 — 남은 공휴일이 있으면 보이고, 없으면 「없음」 타일을 숨겨 둔다. 받기 전이면 타일 없음 */
function holidaySlot(src: WidgetSource): WidgetSlot {
  if (!src.holidays) return { tile: null, auto: true };
  const tile = holidayTile(src.holidays, src.start, src.today);
  if (tile) return { tile, auto: true };
  const sub = src.today < src.start ? "여행 기간에 없어요" : "남은 기간에 없어요";
  return { tile: { key: "holiday", label: "공휴일", main: "없음", sub }, auto: false };
}

/** 현지 시간 — 늘 그릴 수 있고, 한국과 시차가 있을 때만 보인다 */
function timeSlot(src: WidgetSource): WidgetSlot {
  const offset = offsetFromKorea(src.timeZone, src.at);
  const tile: WidgetTile = {
    key: "time",
    label: "현지 시간",
    main: localTimeText(src.timeZone, src.at),
    sub: offsetLabel(offset),
  };
  return { tile, auto: offset !== 0 };
}

/** 위젯 넷 — 날씨는 받은 타일 그대로(받기 전 · 여행이 끝났으면 없음), 나머지는 위 규칙대로 */
export function widgetSlots(src: WidgetSource): WidgetSlots {
  return {
    weather: { tile: src.weather, auto: true },
    rate: rateSlot(src),
    holiday: holidaySlot(src),
    time: timeSlot(src),
  };
}
