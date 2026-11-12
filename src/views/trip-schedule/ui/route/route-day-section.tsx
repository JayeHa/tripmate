"use client";

import { useMemo } from "react";

import {
  buildRouteDay,
  type DayMode,
  type FlightTimes,
  itemCoords,
  placeKeyOf,
  type TimelineRow,
} from "@/entities/schedule-item";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";

import type { RecordStop } from "../../lib/record";
import type { ScheduleRecord } from "../../model/use-schedule-record";
import { RouteDayHeader } from "./route-day-header";
import { RouteStopItem } from "./route-stop-item";
import { stopVisitsOf } from "./stop-visits";

/** PC — 목록 ↔ 지도 올림(hover). 모바일은 없다 */
export type RouteHover = {
  /** 올린 장소(목록 카드 · 지도 핀) */
  stopId: string | null;
  /** 올린 구간 글자의 도착 장소 */
  segTo: string | null;
  onStop: (id: string | null) => void;
  onSeg: (toId: string | null) => void;
};

export type RouteDaySectionProps = {
  startDate: string;
  day: number;
  rows: TimelineRow[];
  summary?: string | null;
  holiday?: string | null;
  weather?: SourcedWeatherDay | null;
  /** 항공편 카드의 편명 시각 */
  flightOf: (id: string) => FlightTimes | null;
  /** 펼친 역(화면에 하나) */
  openId: string | null;
  onToggle: (id: string) => void;
  /** PC — 지도에 강조된 장소(스크롤 기준선). 고른 장소가 지도를 이끄는 동안은 null */
  focusId?: string | null;
  /** PC — 카드에 지도 핀 번호 「📍5」 */
  showPins?: boolean;
  /** PC — 지도와 맞추는 올림 */
  hover?: RouteHover;
  onOpen: (row: TimelineRow) => void;
  onEditMove?: (row: TimelineRow) => void;
  /** PC — 펼친 카드의 「+ 메모」. 모바일은 상세에서 메모를 쓴다 */
  onAddMemo?: (row: TimelineRow) => void;
  /** 「🗺 지도에서」 — 그날 지도에서 그 장소를 고른 채로. PC 는 없다(지도가 옆에 있다) */
  onShowMap?: (day: number, id: string) => void;
  checklistOf: (row: TimelineRow) => { count: number; href: string };
  voucherOf: (row: TimelineRow) => { count: number; onOpen: () => void };
  /** 「계획 | 기록」 — 기록이면 다녀감으로 역 · 선을 칠한다 */
  mode: DayMode;
  onModeChange: (mode: DayMode) => void;
  record: ScheduleRecord;
};

/**
 * 하루 노선도 — day 머리와 역 · 구간. 일정이 없으면 한 줄 안내.
 * `data-day-section` 으로 화면이 보고 있는 날을 고른다
 */
export function RouteDaySection({
  startDate,
  day,
  rows,
  summary,
  holiday,
  weather,
  flightOf,
  openId,
  onToggle,
  focusId = null,
  showPins = false,
  hover,
  onOpen,
  onEditMove,
  onAddMemo,
  onShowMap,
  checklistOf,
  voucherOf,
  mode,
  onModeChange,
  record,
}: RouteDaySectionProps) {
  const route = useMemo(() => buildRouteDay(rows, flightOf), [rows, flightOf]);
  const { visits, tones } = stopVisitsOf(route, mode, record, day);
  // 머리 개수 줄은 기록 모드만
  const recTones = mode === "record" ? tones : null;
  return (
    <section data-day-section={day} aria-label={`day ${day + 1}`} className="flex flex-col pb-6">
      <RouteDayHeader
        startDate={startDate}
        day={day}
        route={route}
        summary={summary}
        holiday={holiday}
        weather={weather}
        onOpenNote={onOpen}
        mode={mode}
        onModeChange={onModeChange}
        done={recTones?.filter((t) => t.tone === "done").length ?? 0}
        passed={recTones?.filter((t) => t.tone === "pass").length ?? 0}
        // 보이는 것만 — 다녀감을 되돌려도 별점 · 글은 남아 있지만 카드에 그 줄이 없다
        rated={countRatedPlaces(route.stops, recTones, record.stars)}
        notes={countDone(route.stops, recTones, record.notes)}
        photos={countPhotos(route.stops, recTones, record.photos)}
      />
      {route.stops.length === 0 && (
        <p className="px-5 pt-1 pb-3 text-[13px] text-ink-350">아직 일정이 없어요</p>
      )}
      <ol className="pt-1.5 pr-4 pl-1">
        {route.stops.map((stop, i) => {
          const prev = route.stops[i - 1];
          const { row } = stop;
          const id = row.item.id;
          const { hovered, ...hoverHandlers } = stopHover(hover, id, stop.next?.item.id);
          return (
            <RouteStopItem
              key={row.item.id}
              stop={stop}
              inSeg={prev?.seg ?? null}
              prevAt={prev ? itemCoords(prev.row.item) : null}
              open={openId === row.item.id}
              onToggle={() => onToggle(row.item.id)}
              focused={openId !== id && (focusId === id || hovered)}
              {...hoverHandlers}
              showPin={showPins}
              visit={visits[i]}
              checklist={checklistOf(row)}
              vouchers={voucherOf(row)}
              onOpenDetail={() => onOpen(row)}
              onAddMemo={onAddMemo && (() => onAddMemo(row))}
              onShowMap={onShowMap && (() => onShowMap(day, row.item.id))}
              onOpenNote={onOpen}
              onEditMove={onEditMove}
            />
          );
        })}
      </ol>
    </section>
  );
}

/**
 * 역 하나의 올림 prop(PC 만) — 지도 핀에 올린 장소인지, 카드 · 다음 구간 글자에 올리고 내릴 때 알릴 곳,
 * 다음 구간 글자에 밑줄을 칠지(지도의 그 구간을 진하게 그리는 중). 마지막 역은 다음 구간이 없다
 */
function stopHover(hover: RouteHover | undefined, id: string, nextId: string | undefined) {
  if (!hover) return { hovered: false };
  return {
    hovered: hover.stopId === id,
    onHover: (on: boolean) => hover.onStop(on ? id : null),
    segHighlight: !!nextId && hover.segTo === nextId,
    onSegHover: nextId ? (on: boolean) => hover.onSeg(on ? nextId : null) : undefined,
  };
}

/** 다녀온 장소에 붙인 사진 수. 계획 모드는 0 */
function countPhotos(
  stops: readonly { row: TimelineRow }[],
  tones: RecordStop[] | null,
  photos: ScheduleRecord["photos"],
): number {
  return stops.reduce(
    (n, s, i) => n + (tones?.[i].tone === "done" ? (photos[s.row.item.id]?.length ?? 0) : 0),
    0,
  );
}

/** 다녀온 장소 중 별점을 매긴 장소의 수 — 같은 장소(숙소 두 번)는 한 번만 센다. 계획 모드는 0 */
function countRatedPlaces(
  stops: readonly { row: TimelineRow }[],
  tones: RecordStop[] | null,
  stars: ScheduleRecord["stars"],
): number {
  const keys = stops
    .filter((s, i) => tones?.[i].tone === "done" && stars[s.row.item.id])
    .map((s) => placeKeyOf(s.row.item));
  return new Set(keys).size;
}

/** 다녀온 장소 중 값(기록 글)이 있는 곳의 수. 계획 모드는 0 */
function countDone(
  stops: readonly { row: TimelineRow }[],
  tones: RecordStop[] | null,
  values: Readonly<Record<string, unknown>>,
): number {
  return stops.filter((s, i) => tones?.[i].tone === "done" && values[s.row.item.id]).length;
}
