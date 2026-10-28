import {
  CalendarDays,
  ChevronRight,
  Clock,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Coins,
  type LucideIcon,
  Sun,
} from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import type { Sky } from "@/shared/lib/weather";

import type { WidgetTile } from "../../lib/widgets";
import { HolidayCredit } from "./holiday-credit";
import { RateCredit } from "./rate-credit";
import { WeatherCredit } from "./weather-credit";

const ICON: Record<WidgetTile["key"], LucideIcon> = {
  weather: CloudSun,
  rate: Coins,
  holiday: CalendarDays,
  time: Clock,
};

const SKY_ICON: Record<Sky, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

/** 타일 아이콘 — 날씨는 하늘 모양대로(모르면 구름 낀 해) */
const iconOf = (t: WidgetTile) => (t.sky ? SKY_ICON[t.sky] : ICON[t.key]);

type TileProps = {
  tile: WidgetTile;
  onOpen?: () => void;
  className: string;
  children: React.ReactNode;
};

/** 타일 껍데기 — 누를 수 있으면(환율 → 계산기) 버튼, 아니면 칸 */
function Tile({ tile, onOpen, className, children }: TileProps) {
  if (!onOpen) return <div className={className}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${tile.label} 계산기 열기`}
      className={cn(className, "cursor-pointer text-left")}
    >
      {children}
    </button>
  );
}

type WidgetRowProps = {
  tiles: WidgetTile[];
  layout: "mobile" | "pc";
  /** 환율 타일을 누르면 — 계산기 */
  onOpenRate: () => void;
  /** 바깥 데이터를 보이고 있다(날씨 · 실시간 환율 · 공휴일) — 줄 아래 오른쪽에 출처 링크 */
  credits: { weather: boolean; rate: boolean; holiday: boolean };
};

/**
 * 현지 정보 위젯 줄. 모바일은 회색 타일(76 · r12)을 나란히, PC 는 흰 카드 한 장을 세로선으로 나눈 칸(아이콘 칸 36 · 값 옆 보조).
 * 환율 타일만 누를 수 있다(계산기)
 */
export function WidgetRow({ tiles, layout, onOpenRate, credits }: WidgetRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        layout === "pc" ? "mx-10 mt-3.5 mb-4 gap-1.5" : "gap-1.5 px-5 pt-3 pb-3.5",
      )}
    >
      <Tiles tiles={tiles} layout={layout} onOpenRate={onOpenRate} />
      {(credits.weather || credits.rate || credits.holiday) && (
        <span className="flex flex-wrap justify-end gap-x-2 self-end">
          {credits.weather && <WeatherCredit />}
          {credits.rate && <RateCredit />}
          {credits.holiday && <HolidayCredit />}
        </span>
      )}
    </div>
  );
}

type TilesProps = Omit<WidgetRowProps, "credits">;

/** 타일들 — 모바일 회색 타일 나란히, PC 흰 카드 한 장 */
function Tiles({ tiles, layout, onOpenRate }: TilesProps) {
  const openOf = (t: WidgetTile) => (t.key === "rate" ? onOpenRate : undefined);
  if (layout === "mobile") {
    return (
      <div className="flex gap-2">
        {tiles.map((t) => {
          const Icon = iconOf(t);
          return (
            <Tile
              key={t.key}
              tile={t}
              onOpen={openOf(t)}
              className="flex h-19 min-w-0 flex-1 flex-col gap-0.5 rounded-card bg-surface-sunken px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-1 text-[11px] font-bold whitespace-nowrap text-ink-400">
                <Icon className="size-3.25 shrink-0" aria-hidden="true" />
                <span className="truncate">{t.label}</span>
              </span>
              <span className="truncate text-base font-extrabold text-ink-900">{t.main}</span>
              <span
                className={cn("truncate text-[11px] text-ink-400", t.holiday && "text-holiday")}
              >
                {t.sub}
              </span>
            </Tile>
          );
        })}
      </div>
    );
  }
  return (
    <div className="flex overflow-hidden rounded-card border border-line-card bg-white shadow-[0_1px_6px_rgba(0,0,0,.05)]">
      {tiles.map((t, i) => {
        const Icon = iconOf(t);
        const open = openOf(t);
        return (
          <Tile
            key={t.key}
            tile={t}
            onOpen={open}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5",
              i > 0 && "border-l border-surface-muted",
              open && "hover:bg-surface-sunken",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-memo bg-surface-muted">
              <Icon className="size-4.5 text-ink-500" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-bold whitespace-nowrap text-ink-400">{t.label}</span>
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="text-[17px] font-extrabold whitespace-nowrap text-ink-900">
                  {t.main}
                </span>
                <span className={cn("truncate text-xs text-ink-400", t.holiday && "text-holiday")}>
                  {t.sub}
                </span>
              </span>
            </span>
            {open && <ChevronRight className="size-4 shrink-0 text-handle" aria-hidden="true" />}
          </Tile>
        );
      })}
    </div>
  );
}
