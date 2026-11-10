"use client";

import { type ReactNode, useMemo } from "react";

import {
  buildRouteDay,
  RouteMap,
  routeMapOf,
  ScheduleMap,
  type TimelineRow,
} from "@/entities/schedule-item";

import { mapDayOf } from "../../lib/focus";
import { useFlightTimes } from "../../model/use-flight-times";
import { RouteLegend } from "../route-map/route-legend";
import type { ScheduleLayoutProps } from "../schedule-layout";

/** 지도 위 왼쪽 위 줄(너비 프리셋 · 범례, 위 12 + 높이 36)을 비켜 맞춘다 */
const INSET = { top: 56, bottom: 16, side: 16 };

type PcMapPaneProps = Pick<ScheduleLayoutProps, "trip" | "edit" | "sections" | "day"> & {
  /** 카드를 눌러 고른 장소 — 보고 있는 날 안에 있을 때만(다른 날로 가면 null) */
  selectedId: string | null;
  /** 스크롤 기준선을 지난 장소 */
  focusId: string | null;
  /** 날짜로 스크롤해 붙잡아 둔 동안 — 강조된 장소 대신 보고 있는 날을 그린다 */
  holding: boolean;
  /** 핀을 눌렀다 */
  onPick: (id: string) => void;
  /** 바뀌면 핀을 다시 맞춘다(목록 칸 너비) */
  fitKey: number;
  /** 왼쪽 위 줄 맨 앞(너비 프리셋) */
  presets: ReactNode;
};

/**
 * PC 일정 오른쪽 지도 칸. 보기에서는 동선 지도(모바일과 같은 선 · 범위 밖 처리)로 하루 동선을 그린다 —
 * 고른 장소가 있으면 그 장소를, 없으면 스크롤 강조된 장소를 강조하고 그 장소의 날을 그린다.
 * 편집 중에는 편집하는 날의 일정 지도. 왼쪽 위에 너비 프리셋 · 범례(보기에서만)
 */
export function PcMapPane({
  trip,
  edit,
  sections,
  day,
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
  selectedId: string | null;
  onSelect: (id: string) => void;
  fitKey: number;
};

/** 하루 동선 지도 — 그날 줄로 노선 · 핀을 만든다 */
function PcRouteMap({ tripId, rows, selectedId, onSelect, fitKey }: PcRouteMapProps) {
  const flightOf = useFlightTimes(tripId);
  const data = useMemo(() => routeMapOf(buildRouteDay(rows, flightOf)), [rows, flightOf]);
  return (
    <RouteMap
      data={data}
      selectedId={selectedId}
      onSelect={onSelect}
      inset={INSET}
      fitKey={fitKey}
    />
  );
}
