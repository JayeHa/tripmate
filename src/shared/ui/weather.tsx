import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Sun,
} from "lucide-react";

import type { Sky } from "@/shared/lib/weather";

/** 하늘 모양 → 아이콘(여행 홈 날씨 타일 · 일정 날짜 머리) */
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
