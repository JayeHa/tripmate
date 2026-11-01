"use client";

import type { Trip } from "@/entities/trip";
import { dayIndexToDate, dayParts, todayISO } from "@/shared/lib/days";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { useOnline } from "@/shared/lib/use-online";
import { cn } from "@/shared/lib/utils";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";
import { SheetDialog } from "@/shared/ui/sheet-dialog";
import { DayWeatherLines, WeatherCredit } from "@/shared/ui/weather";

import { useTripWeather } from "../../model/use-trip-weather";

type DayRowProps = {
  startDate: string;
  day: number;
  weather: SourcedWeatherDay | null;
  today: boolean;
};

/** 하루 줄 — 「day 3  11.2/월」(오늘이면 파란 바탕 · 「오늘」) 아래 날씨 · 옷차림 두 줄. 그 날 날씨가 없으면 한 줄 안내 */
function DayRow({ startDate, day, weather, today }: DayRowProps) {
  const { date, dow } = dayParts(startDate, day);
  return (
    <li
      aria-current={today ? "date" : undefined}
      className={cn(
        "flex flex-col gap-1.5 rounded-memo px-3.5 py-3",
        today ? "bg-brand-soft" : "border-b border-divider last:border-b-0",
      )}
    >
      <p className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-extrabold text-ink-900">day {day + 1}</span>
        <span className="text-sm text-ink-400">
          {date}/{dow}
        </span>
        {today && <span className="text-xs font-bold text-brand-text">오늘</span>}
      </p>
      {weather ? (
        <DayWeatherLines weather={weather} />
      ) : (
        <p className="text-[13px] text-ink-350">날씨 정보가 없어요</p>
      )}
    </li>
  );
}

type WeatherListProps = { tripId: string; trip: Trip };

/**
 * 창 안 — 여행 날마다 한 줄. 지난 날은 기록, 16일 안은 예보, 그보다 먼 날은 작년 · 평년(줄마다 출처 표시).
 * 처음 받는 중이면 「불러오는 중」, 하나도 없으면 오프라인 「연결되면 볼 수 있어요」 · 아니면 「가져오지 못했어요」
 */
function WeatherList({ tripId, trip }: WeatherListProps) {
  const { total, weatherOf, loading } = useTripWeather(tripId, trip);
  const online = useOnline();
  const today = todayISO();
  const days = Array.from({ length: total }, (_, day) => ({ day, weather: weatherOf(day) }));
  if (!days.some((d) => d.weather)) {
    return <p className="py-10 text-center text-sm text-ink-400">{emptyText(loading, online)}</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col">
        {days.map(({ day, weather }) => (
          <DayRow
            key={day}
            startDate={trip.start_date}
            day={day}
            weather={weather}
            today={dayIndexToDate(trip.start_date, day) === today}
          />
        ))}
      </ul>
      <p className="self-end">
        <WeatherCredit />
      </p>
    </div>
  );
}

/** 보일 날씨가 하나도 없을 때의 안내 */
function emptyText(loading: boolean, online: boolean) {
  if (loading) return "날씨를 불러오는 중이에요";
  return online ? "날씨를 가져오지 못했어요" : "연결되면 볼 수 있어요";
}

type WeatherSheetProps = { open: boolean; onClose: () => void; tripId: string; trip: Trip };

/**
 * 여행 홈 날씨 타일을 누르면 — 여행 기간 날마다 날씨 · 추천 옷차림. 모바일 바텀시트, PC 가운데 창.
 * 처음 열 때 날씨를 받는다(일정 화면과 같은 데이터라 이미 받았으면 바로 보인다). 닫히는 동안 내용을 남긴다
 */
export function WeatherSheet({ open, onClose, tripId, trip }: WeatherSheetProps) {
  const opened = useHeldWhileClosing(open, open || null);
  return (
    <SheetDialog open={open} onClose={onClose} title="여행 기간 날씨">
      {opened && <WeatherList tripId={tripId} trip={trip} />}
    </SheetDialog>
  );
}
