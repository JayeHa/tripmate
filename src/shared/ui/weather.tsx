import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Shirt,
  Sun,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { Sky } from "@/shared/lib/weather";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";
import { dayWeatherLine } from "@/shared/lib/weather-line";

/** 하늘 모양 → 아이콘(여행 홈 날씨 타일 · 날씨 창 · 일정 날짜 머리) */
export const SKY_ICON: Record<Sky, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

/**
 * 날씨 데이터의 출처 — Open-Meteo 무료 API 는 CC BY 4.0 이라 쓰는 곳에 출처 링크를 둔다.
 * 날씨를 보일 때만 그린다
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

type DayWeatherLinesProps = {
  weather: SourcedWeatherDay;
  /** 바깥 여백 등 — 글자 크기 · 색은 이 안에서 정한다 */
  className?: string;
};

/**
 * 하루 날씨 두 줄 — 「☁ 18° / 11° · 비 40% · 예보」(지난 날은 기록이라 출처 표시가 없고, 평년은 하늘 아이콘이 없다)과
 * 그 아래 추천 옷차림 「👕 맨투맨 · 가디건 · 긴바지」. 일정 날짜 머리 · 여행 홈 날씨 창
 */
export function DayWeatherLines({ weather, className }: DayWeatherLinesProps) {
  const line = dayWeatherLine(weather);
  const Icon = line.sky ? SKY_ICON[line.sky] : null;
  return (
    <div className={cn("flex flex-col gap-1 text-[13px] text-ink-500", className)}>
      <p className="flex items-center gap-1.5">
        {Icon && (
          <Icon role="img" aria-label={line.skyLabel ?? undefined} className="size-4 shrink-0" />
        )}
        <span className="font-semibold text-ink-700">{line.temps}</span>
        {line.rain && <span>· {line.rain}</span>}
        {line.source && <span className="text-ink-350">· {line.source}</span>}
      </p>
      <p className="flex items-center gap-1.5">
        <Shirt role="img" aria-label="추천 옷차림" className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{line.outfit}</span>
      </p>
    </div>
  );
}
