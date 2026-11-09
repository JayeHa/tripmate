"use client";

import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { MapGuard } from "@/shared/ui/map-guard";

import { routeLineStyle } from "../../lib/route";
import {
  clampToView,
  type MapInset,
  type MapView,
  type RouteMapData,
  type RouteMapPin,
} from "../../lib/route-map";
import { itemName } from "../../model/place";
import { MapPin, pinAnchor } from "../schedule-map/map-pin";
import { RouteCamera } from "./route-camera";
import { RoutePolyline } from "./route-polyline";

/** 핀이 하나도 없는 날의 중심. 여행 도시 좌표를 아직 받지 않아 도쿄역으로 둔다 */
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 };
/** 고른 장소로 들어오는 구간 */
const SELECTED_LINE = "#111111";

type RouteMapProps = {
  data: RouteMapData;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 지도 위를 덮는 칸 — 맞추기 · 범위 밖 핀을 이 칸 밖(보이는 곳)에 둔다 */
  inset: MapInset;
  className?: string;
};

/**
 * 동선 지도 — 번호 핀(예약 상태색) + 수단별 선(대중교통 실선 · 도보 점선 · 항공 파선, 노선도와 같은 언어).
 * 고른 장소는 강조 핀, 그리로 들어오는 구간은 잉크색. 범위 밖 장소(공항 · 근교)는 맞추기에서 빼고
 * 보이는 칸 가장자리에 핀을 붙여 「나리타 · 58km 밖」 을 단다. 누르면 고르고 그곳까지 보이게 넓힌다.
 * AdvancedMarker 라 NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID 가 필요하다
 */
export function RouteMap({ data, selectedId, onSelect, inset, className }: RouteMapProps) {
  const [view, setView] = useState<MapView | null>(null);
  const selectedPin = data.pins.find((p) => selectedId !== null && p.ids.includes(selectedId));
  const points = data.pins.filter((p) => p.offKm === null || p === selectedPin).map((p) => p.at);
  return (
    <div className={cn("relative isolate z-0 size-full bg-map-bg", className)}>
      <MapGuard>
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          defaultCenter={data.pins[0]?.at ?? DEFAULT_CENTER}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          className="size-full"
          onBoundsChanged={(e) => {
            const div = e.map.getDiv();
            setView({ ...e.detail.bounds, width: div.clientWidth, height: div.clientHeight });
          }}
        >
          {data.lines.map((line) => {
            const selected = line.toId === selectedId;
            const style = routeLineStyle(line.mode, "plan", { onMap: true });
            return (
              <RoutePolyline
                key={line.key}
                from={line.from}
                to={line.to}
                line={selected ? { ...style, color: SELECTED_LINE } : style}
                zIndex={selected ? 2 : 1}
              />
            );
          })}
          {data.pins.map((pin) => (
            <RouteMapMarker
              key={pin.key}
              pin={pin}
              selected={pin === selectedPin}
              at={pin.offKm !== null && view ? clampToView(pin.at, view, inset) : pin.at}
              onSelect={() => onSelect(pin.ids[0])}
            />
          ))}
          <RouteCamera
            points={points}
            selected={selectedPin?.at ?? null}
            inset={inset}
            view={view}
          />
        </Map>
      </MapGuard>
    </div>
  );
}

type RouteMapMarkerProps = {
  pin: RouteMapPin;
  selected: boolean;
  /** 핀을 그릴 자리 — 범위 밖이면 보이는 칸 가장자리로 끌어온 좌표 */
  at: { lat: number; lng: number };
  onSelect: () => void;
};

/** 핀 하나. 범위 밖이면 아래에 「나리타 · 58km 밖」(이름 첫 낱말) */
function RouteMapMarker({ pin, selected, at, onSelect }: RouteMapMarkerProps) {
  const name = itemName(pin.row.item);
  return (
    <AdvancedMarker
      position={at}
      title={name}
      onClick={onSelect}
      zIndex={selected ? 10 : 1}
      {...pinAnchor(selected)}
    >
      <span className="relative block w-max">
        <MapPin
          num={pin.label}
          size="lg"
          status={pin.row.status}
          category={pin.row.category}
          focus={selected}
        />
        {pin.offKm !== null && (
          <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-button bg-[rgba(17,17,17,.78)] px-1.75 py-0.75 text-[11px] font-extrabold whitespace-nowrap text-white">
            {name.split(" ")[0]} · {Math.round(pin.offKm)}km 밖
          </span>
        )}
      </span>
    </AdvancedMarker>
  );
}
