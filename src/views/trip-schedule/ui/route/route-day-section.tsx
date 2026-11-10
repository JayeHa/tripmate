"use client";

import { useMemo } from "react";

import {
  buildRouteDay,
  type FlightTimes,
  itemCoords,
  type PastKind,
  type TimelineRow,
} from "@/entities/schedule-item";
import type { SourcedWeatherDay } from "@/shared/lib/weather-days";

import { RouteDayHeader } from "./route-day-header";
import { RouteStopItem } from "./route-stop-item";

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
  past: ReadonlyMap<string, PastKind>;
  onOpen: (row: TimelineRow) => void;
  onEditMove?: (row: TimelineRow) => void;
  /** 「🗺 지도에서」 — 그날 지도에서 그 장소를 고른 채로. PC 는 없다(지도가 옆에 있다) */
  onShowMap?: (day: number, id: string) => void;
  checklistOf: (row: TimelineRow) => { count: number; href: string };
  voucherOf: (row: TimelineRow) => { count: number; onOpen: () => void };
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
  past,
  onOpen,
  onEditMove,
  onShowMap,
  checklistOf,
  voucherOf,
}: RouteDaySectionProps) {
  const route = useMemo(() => buildRouteDay(rows, flightOf), [rows, flightOf]);
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
      />
      {route.stops.length === 0 && (
        <p className="px-5 pt-1 pb-3 text-[13px] text-ink-350">아직 일정이 없어요</p>
      )}
      <ol className="pt-1.5 pr-4 pl-1">
        {route.stops.map((stop, i) => {
          const prev = route.stops[i - 1];
          const { row } = stop;
          return (
            <RouteStopItem
              key={row.item.id}
              stop={stop}
              inSeg={prev?.seg ?? null}
              prevAt={prev ? itemCoords(prev.row.item) : null}
              open={openId === row.item.id}
              onToggle={() => onToggle(row.item.id)}
              focused={openId !== row.item.id && focusId === row.item.id}
              showPin={showPins}
              past={past.get(row.item.id) ?? null}
              nextPast={!!stop.next && past.has(stop.next.item.id)}
              checklist={checklistOf(row)}
              vouchers={voucherOf(row)}
              onOpenDetail={() => onOpen(row)}
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
