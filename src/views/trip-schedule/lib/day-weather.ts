import type { TimelineRow } from "@/entities/schedule-item";
import { outfitFor } from "@/shared/lib/outfit";
import { type Sky, SKY_LABEL, skyOf } from "@/shared/lib/weather";
import type { SourcedWeatherDay, WeatherSource } from "@/shared/lib/weather-days";

/**
 * 날마다 날씨를 볼 도시 — 그날 일정 장소가 가장 많은 도시(같으면 먼저 나온 장소의 도시).
 * 장소가 없는 날은 전날 도시, 첫날이면 여행의 첫 도시. 여행 도시를 모르면 null
 */
export function dayCities(
  sections: readonly { rows: readonly TimelineRow[] }[],
  firstCity: string | null,
): (string | null)[] {
  let prev = firstCity;
  return sections.map(({ rows }) => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const city = r.item.place?.city_id;
      if (city) counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    let best: string | null = null;
    for (const [city, n] of counts) if (!best || n > counts.get(best)!) best = city;
    prev = best ?? prev;
    return prev;
  });
}

/** 출처 표시 — 지난 날 기록은 표시하지 않는다 */
const SOURCE_LABEL: Record<WeatherSource, string | null> = {
  record: null,
  forecast: "예보",
  lastYear: "작년",
  normal: "평년",
};

/** 소수 기온 → 「18°」 */
const degree = (c: number) => `${Math.round(c)}°`;

/** 날짜 머리 날씨 줄의 내용 */
export type DayWeatherLine = {
  /** 하늘 모양(아이콘). 평년 · 모르는 코드면 null */
  sky: Sky | null;
  /** 「흐림」 — 아이콘의 읽기용 이름 */
  skyLabel: string | null;
  /** 「18° / 11°」 */
  temps: string;
  /** 「비 40%」 — 예보에만. 0% 면 null(날마다 「비 0%」 가 늘어서면 시끄럽다) */
  rain: string | null;
  /** 「예보」 · 「작년」 · 「평년」. 지난 날이면 null */
  source: string | null;
  /** 추천 옷차림 「맨투맨 · 가디건 · 긴바지 · 우산」 — 하루 평균 기온 · 일교차 · 비 올 확률로 */
  outfit: string;
};

/** 그날 날씨 → 날짜 머리 날씨 줄 「☁ 18° / 11° · 비 40% · 예보」 과 그 아래 옷차림 줄 */
export function dayWeatherLine(day: SourcedWeatherDay): DayWeatherLine {
  const sky = skyOf(day.code);
  return {
    sky,
    skyLabel: sky ? SKY_LABEL[sky] : null,
    temps: `${degree(day.max)} / ${degree(day.min)}`,
    rain: day.rain ? `비 ${day.rain}%` : null,
    source: SOURCE_LABEL[day.source],
    outfit: outfitFor(day).join(" · "),
  };
}
