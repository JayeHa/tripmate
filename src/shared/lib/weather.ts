/**
 * 날씨(Open-Meteo) — 서버 라우트 `/api/weather/forecast` · `/api/weather/normals` 가 Open-Meteo 응답을 이 모양으로 바꿔 보낸다.
 * 기온은 °C, 날짜는 그 장소의 현지 날짜(yyyy-MM-dd)
 * @see https://open-meteo.com/en/docs
 */

/** 하루 예보 — 최고 · 최저 기온, 날씨 코드(WMO), 비 올 확률(%). 코드 · 확률은 모르면 null */
export type WeatherDay = {
  date: string;
  code: number | null;
  max: number;
  min: number;
  rain: number | null;
};

/** 평년 기온 — 그 달 하루 최고 · 최저 기온의 평균(최근 10년) */
export type WeatherNormals = { min: number; max: number };

/** 하늘 모양 — 화면이 이걸로 아이콘을 고른다 */
export type Sky = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

/** 하늘 모양의 이름 — 타일 라벨 「날씨 · 맑음」 */
export const SKY_LABEL: Record<Sky, string> = {
  clear: "맑음",
  partly: "구름 조금",
  cloudy: "흐림",
  fog: "안개",
  drizzle: "이슬비",
  rain: "비",
  snow: "눈",
  storm: "뇌우",
};

/** WMO 날씨 코드 범위(양끝 포함) → 하늘 모양. 1(대체로 맑음)은 맑음으로 본다 */
const SKY_RANGES: readonly [number, number, Sky][] = [
  [0, 1, "clear"],
  [2, 2, "partly"],
  [3, 3, "cloudy"],
  [45, 48, "fog"],
  [51, 57, "drizzle"],
  [61, 67, "rain"],
  [71, 77, "snow"],
  [80, 82, "rain"],
  [85, 86, "snow"],
  [95, 99, "storm"],
];

/**
 * WMO 날씨 코드 → 하늘 모양. 모르는 코드 · 코드 없음이면 null
 * @see https://open-meteo.com/en/docs#weather_variable_documentation
 */
export function skyOf(code: number | null): Sky | null {
  if (code === null) return null;
  return SKY_RANGES.find(([from, to]) => code >= from && code <= to)?.[2] ?? null;
}

/** 응답의 `daily` 칸 — 객체가 아니면 null */
function dailyOf(json: unknown): Record<string, unknown> | null {
  if (typeof json !== "object" || json === null) return null;
  const { daily } = json as Record<string, unknown>;
  return typeof daily === "object" && daily !== null ? (daily as Record<string, unknown>) : null;
}

/** 배열 칸의 값들 — 숫자가 아닌 칸(null)은 null. 배열이 아니면 빈 배열 */
function numbersOf(value: unknown): (number | null)[] {
  return Array.isArray(value) ? value.map((v) => (typeof v === "number" ? v : null)) : [];
}

/**
 * Open-Meteo 예보 응답 → 날짜순 하루 예보. 최고 · 최저 기온을 모르는 날(맨 끝 날이 비기도 한다)은 뺀다.
 * 모양이 다르면 null
 */
export function parseForecast(json: unknown): WeatherDay[] | null {
  const daily = dailyOf(json);
  if (!daily || !Array.isArray(daily.time)) return null;
  const code = numbersOf(daily.weather_code);
  const max = numbersOf(daily.temperature_2m_max);
  const min = numbersOf(daily.temperature_2m_min);
  const rain = numbersOf(daily.precipitation_probability_max);
  const days: WeatherDay[] = [];
  daily.time.forEach((date, i) => {
    const hi = max[i];
    const lo = min[i];
    if (typeof date !== "string" || hi === null || hi === undefined) return;
    if (lo === null || lo === undefined) return;
    days.push({ date, code: code[i] ?? null, max: hi, min: lo, rain: rain[i] ?? null });
  });
  return days;
}

/** 소수 한 자리 평균. 값이 없으면 null */
function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/**
 * 해마다 받은 그 달 기록(Open-Meteo 과거 날씨 응답 여럿) → 평년 기온. 모든 해의 모든 날을 함께 평균한다.
 * 받은 값이 하나도 없으면 null
 */
export function averageNormals(jsons: readonly unknown[]): WeatherNormals | null {
  const highs: number[] = [];
  const lows: number[] = [];
  for (const json of jsons) {
    const daily = dailyOf(json);
    highs.push(...numbersOf(daily?.temperature_2m_max).filter((v) => v !== null));
    lows.push(...numbersOf(daily?.temperature_2m_min).filter((v) => v !== null));
  }
  const max = mean(highs);
  const min = mean(lows);
  return max === null || min === null ? null : { min, max };
}

/** 평년을 내는 해의 수 — 최근 10년 */
const NORMAL_YEARS = 10;

/** 평년에 쓸 기간들 — 올해 바로 앞 10년의 그 달(1–12) 첫날 ~ 마지막 날. 올해는 그 달이 다 지나지 않았을 수 있어 뺀다 */
export function normalsRanges(month: number, thisYear: number): { start: string; end: string }[] {
  const mm = String(month).padStart(2, "0");
  return Array.from({ length: NORMAL_YEARS }, (_, i) => {
    const year = thisYear - NORMAL_YEARS + i;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${last}` };
  });
}
