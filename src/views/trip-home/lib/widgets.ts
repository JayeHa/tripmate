import {
  currencyName,
  decimalsOf,
  type ExchangeRates,
  formatMoney,
  roundTo,
} from "@/shared/lib/money";

/** 위젯 타일 한 칸 — 라벨 · 큰 값 · 아래 보조 */
export type WidgetTile = { key: "rate" | "time"; label: string; main: string; sub: string };

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

/** 위젯을 정하는 데 필요한 것 — 여행지(첫 도시)의 통화 · 시간대와 여행 환율 */
export type WidgetSource = {
  currency: string;
  timeZone: string;
  home: string;
  rates: ExchangeRates;
  at: Date;
  /** 실시간 환율 — 여행 환율과 같은 단위의 기준 화폐 금액(「지금 905」). 모르면 null */
  live: number | null;
};

/**
 * 위젯 줄의 타일 — 환율(여행지 통화가 기준 화폐와 다르고 여행 환율이 있을 때) · 현지 시간(한국과 시차가 있을 때).
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
