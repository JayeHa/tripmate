import { durationText, itemName, type RouteDay, type TimelineRow } from "@/entities/schedule-item";
import { dateTone, dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";
import { DayWeatherLines } from "@/shared/ui/weather";

import { DATE_TONE } from "../date-tone";

type RouteDayHeaderProps = {
  startDate: string;
  day: number;
  route: RouteDay;
  /** 하루 요약(편집 모드에서 쓴다) */
  summary?: string | null;
  /** 여행지 공휴일 이름 — 날짜 옆에 빨갛게 */
  holiday?: string | null;
  weather?: SourcedWeatherDay | null;
  /** 날짜 메모를 눌렀다 — 시간 · 메모 창 */
  onOpenNote: (note: TimelineRow) => void;
};

/**
 * 노선도의 day 머리 — 「11.2 (월) 공휴일」(12/700 회색) + 「day 3」(22/800) · 날씨 · 하루 요약 ·
 * 요약 칩(「🚇 대중교통 2시간 5분」 · 「🚶 도보 25분」 · 「9곳」, 0 이면 그 칩은 뺀다) · 첫 역 앞의 날짜 메모(「📌」, 누르면 시간 · 메모 창)
 */
export function RouteDayHeader({
  startDate,
  day,
  route,
  summary,
  holiday,
  weather,
  onOpenNote,
}: RouteDayHeaderProps) {
  const { date, dow } = dayParts(startDate, day);
  const tone = dateTone(startDate, day, !!holiday);
  const { transit, walk, places } = route.totals;
  return (
    <div className="flex flex-col gap-2.5 px-5 pt-4 pb-1.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-baseline gap-1.5 text-xs font-bold text-ink-350">
          <span className={cn("shrink-0", tone && DATE_TONE[tone])}>
            {date} ({dow})
          </span>
          {holiday && <span className="truncate text-holiday">{holiday}</span>}
        </span>
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
          day {day + 1}
        </h2>
      </div>
      {weather && <DayWeatherLines weather={weather} />}
      {summary && <p className="text-[13px]/normal text-pretty text-route-walk-text">{summary}</p>}
      {places > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {transit > 0 && (
            <span className={cn(CHIP, "bg-route-transit-soft text-route-transit-text")}>
              🚇 대중교통 {durationText(transit)}
            </span>
          )}
          {walk > 0 && <span className={cn(CHIP, PLAIN)}>🚶 도보 {durationText(walk)}</span>}
          <span className={cn(CHIP, PLAIN)}>{places}곳</span>
        </div>
      )}
      {route.preNotes.map((note) => (
        <button
          type="button"
          key={note.item.id}
          onClick={() => onOpenNote(note)}
          className="rounded-memo bg-white px-2.5 py-2 text-left text-xs/[1.45] whitespace-pre-line text-route-walk-text"
        >
          📌 {itemName(note.item)}
        </button>
      ))}
    </div>
  );
}

/** 요약 칩 — 12/700 · 안쪽 5 10 · r12 */
const CHIP = "rounded-card px-2.5 py-1.25 text-xs font-bold";
/** 도보 · 장소 수 칩 — 회색 목록 바탕 위라 흰 바탕 + 1px 안쪽 테두리 */
const PLAIN = "bg-white text-route-walk-text shadow-[inset_0_0_0_1px_#E9EBEE]";
