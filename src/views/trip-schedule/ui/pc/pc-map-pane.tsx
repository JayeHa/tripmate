"use client";

import { type ReactNode, useMemo } from "react";

import {
  buildRouteDay,
  defaultStopId,
  RouteMap,
  routeMapOf,
  ScheduleMap,
  type TimelineRow,
} from "@/entities/schedule-item";

import { mapDayOf } from "../../lib/focus";
import { useFlightTimes } from "../../model/use-flight-times";
import { RouteLegend } from "../route-map/route-legend";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { PcMapCard } from "./pc-map-card";

/**
 * 지도 위를 덮는 칸을 비켜 맞춘다 — 왼쪽 위 줄(너비 프리셋 · 범례, 위 12 + 높이 36),
 * 왼쪽 아래 지도 카드(아래 20 + 높이 약 150). 카드는 왼쪽 400 만 덮지만 지도 칸 너비를 모르므로 아래 전체를 비킨다
 */
const INSET = { top: 56, bottom: 180, side: 16 };

type PcMapPaneProps = Pick<ScheduleLayoutProps, "trip" | "edit" | "sections" | "day" | "onOpen"> & {
  /** 카드를 눌러 고른 장소 — 보고 있는 날 안에 있을 때만(다른 날로 가면 null) */
  selectedId: string | null;
  /** 스크롤 기준선을 지난 장소 */
  focusId: string | null;
  /** 날짜로 스크롤해 붙잡아 둔 동안 — 강조된 장소 대신 보고 있는 날을 그린다 */
  holding: boolean;
  /** 핀 · 지도 카드 ‹ › 로 장소를 골랐다 */
  onPick: (id: string) => void;
  /** 바뀌면 핀을 다시 맞춘다(목록 칸 너비) */
  fitKey: number;
  /** 왼쪽 위 줄 맨 앞(너비 프리셋) */
  presets: ReactNode;
};

/**
 * PC 일정 오른쪽 지도 칸. 보기에서는 동선 지도(모바일과 같은 선 · 범위 밖 처리)로 하루 동선을 그린다 —
 * 고른 장소가 있으면 그 장소를, 없으면 스크롤 강조된 장소를 강조하고 그 장소의 날을 그린다.
 * 왼쪽 아래 지도 카드는 강조된 장소를 보이고, 그 날에 강조된 장소가 없으면 그날 첫 장소(범위 밖이면 범위 안의 첫 장소)를 보이며 지도에도 강조한다.
 * 편집 중에는 편집하는 날의 일정 지도. 왼쪽 위에 너비 프리셋 · 범례(보기에서만)
 */
export function PcMapPane({
  trip,
  edit,
  sections,
  day,
  onOpen,
  selectedId,
  focusId,
  holding,
  onPick,
  fitKey,
  presets,
}: PcMapPaneProps) {
  const mapDay = mapDayOf(sections, selectedId ?? (holding ? null : focusId), day);
  return (
    <div className="relative min-w-80 flex-1">
      {trip && edit.editing && <ScheduleMap rows={edit.rows} pinSize="lg" fitKey={fitKey} />}
      {trip && !edit.editing && (
        <PcRouteMap
          tripId={trip.id}
          rows={sections[mapDay]?.rows ?? []}
          selectedId={selectedId ?? focusId}
          onSelect={onPick}
          onOpenDetail={onOpen}
          fitKey={fitKey}
        />
      )}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 *:pointer-events-auto">
        {presets}
        {!edit.editing && <RouteLegend className="bg-white/94 px-3 py-2 text-xs" />}
      </div>
    </div>
  );
}

type PcRouteMapProps = {
  tripId: string;
  /** 지도에 그릴 날의 타임라인 줄 */
  rows: TimelineRow[];
  /** 강조할 장소 — 다른 날의 장소이거나 없으면 그날 첫 장소 */
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (row: TimelineRow) => void;
  fitKey: number;
};

/** 하루 동선 지도 + 지도 카드 — 그날 줄로 노선 · 핀을 만든다 */
function PcRouteMap({ tripId, rows, selectedId, onSelect, onOpenDetail, fitKey }: PcRouteMapProps) {
  const flightOf = useFlightTimes(tripId);
  const data = useMemo(() => routeMapOf(buildRouteDay(rows, flightOf)), [rows, flightOf]);
  const shownId = data.stops.some((s) => s.row.item.id === selectedId)
    ? selectedId
    : defaultStopId(data);
  return (
    <>
      <RouteMap
        data={data}
        selectedId={shownId}
        onSelect={onSelect}
        inset={INSET}
        fitKey={fitKey}
      />
      {shownId && (
        <PcMapCard
          stops={data.stops}
          stopId={shownId}
          onPick={onSelect}
          onOpenDetail={onOpenDetail}
        />
      )}
    </>
  );
}
