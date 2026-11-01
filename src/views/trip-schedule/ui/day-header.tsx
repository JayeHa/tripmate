import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import { dateTone, dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";
import { SKY_ICON } from "@/shared/ui/weather";

import { dayWeatherLine } from "../lib/day-weather";
import { DATE_TONE } from "./date-tone";

type DayHeaderProps = {
  startDate: string;
  day: number;
  /** 그날 메모 있는 카드가 하나라도 있으면 「메모 모두 펼치기/접기」를 보인다 */
  hasMemos: boolean;
  allOpen: boolean;
  onToggleAll: () => void;
  /** 있으면(PC) 버튼 줄 왼쪽에 「메모 N개 · 장소 N곳」 */
  counts?: { memos: number; places: number };
  /** 제목 아래 한 줄(편집 모드에서 쓴다). 없으면 그리지 않는다 */
  summary?: string | null;
  /** 여행지 공휴일 이름 — 날짜 옆에 빨갛게(길면 말줄임) */
  holiday?: string | null;
  /** 그날 날씨 — 제목 아래 한 줄. 없으면 그리지 않는다 */
  weather?: SourcedWeatherDay | null;
  /** 제목 오른쪽 「편집」. 일정을 다 읽기 전에는 없다 */
  onEdit?: () => void;
};

/**
 * 「day 1  10.31/토」(토 파랑 · 일 · 공휴일 빨강, 공휴일이면 옆에 빨간 이름) · 오른쪽 「편집」(일정 편집을 연다) · 아래 날씨 한 줄 · 하루 요약.
 * 아래 줄에 메모를 한꺼번에 펼치고 접는 버튼(PC 는 왼쪽에 메모 · 장소 개수).
 */
export function DayHeader({
  startDate,
  day,
  hasMemos,
  allOpen,
  onToggleAll,
  counts,
  summary,
  holiday,
  weather,
  onEdit,
}: DayHeaderProps) {
  const { date, dow } = dayParts(startDate, day);
  const tone = dateTone(startDate, day, !!holiday);
  const Icon = allOpen ? ChevronsDownUp : ChevronsUpDown;
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4.5 pb-1.5">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <h2 className="shrink-0 text-[17px] font-extrabold text-ink-900">day {day + 1}</h2>
          <span className={cn("shrink-0 text-base text-ink-400", tone && DATE_TONE[tone])}>
            {date}/{dow}
          </span>
          {holiday && (
            <span className="truncate text-[13px] font-semibold text-holiday">{holiday}</span>
          )}
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-[15px] text-ink-500">
            편집
          </button>
        )}
      </div>
      {weather && <WeatherLine weather={weather} />}
      {summary && (
        <p className="px-5 pb-3.5 text-[13px]/relaxed text-pretty text-ink-450">{summary}</p>
      )}
      {(hasMemos || counts) && (
        <div className="flex items-center justify-end gap-3 px-5 pb-1.5">
          {counts && (
            <span className="mr-auto text-[13px] text-ink-400">
              메모 {counts.memos}개 · 장소 {counts.places}곳
            </span>
          )}
          {hasMemos && (
            <button
              type="button"
              onClick={onToggleAll}
              className="flex h-8 items-center gap-1.25 rounded-2xl border border-line bg-white px-3 text-[13px] font-bold text-ink-700"
            >
              <Icon className="size-3.75" />
              {allOpen ? "메모 모두 접기" : "메모 모두 펼치기"}
            </button>
          )}
        </div>
      )}
    </>
  );
}

type WeatherLineProps = { weather: SourcedWeatherDay };

/** 날씨 한 줄 「☁ 18° / 11° · 비 40% · 예보」 — 지난 날은 기록이라 출처 표시가 없다. 평년은 하늘 아이콘이 없다 */
function WeatherLine({ weather }: WeatherLineProps) {
  const line = dayWeatherLine(weather);
  const Icon = line.sky ? SKY_ICON[line.sky] : null;
  return (
    <p className="flex items-center gap-1.5 px-5 pb-2 text-[13px] text-ink-500">
      {Icon && (
        <Icon role="img" aria-label={line.skyLabel ?? undefined} className="size-4 shrink-0" />
      )}
      <span className="font-semibold text-ink-700">{line.temps}</span>
      {line.rain && <span>· {line.rain}</span>}
      {line.source && <span className="text-ink-350">· {line.source}</span>}
    </p>
  );
}
