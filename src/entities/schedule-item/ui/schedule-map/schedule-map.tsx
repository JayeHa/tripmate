"use client";

import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import { cn } from "@/shared/lib/utils";

import type { TimelineRow } from "../../lib/timeline";
import { MapPin } from "./map-pin";

/** 핀이 하나도 없는 날의 중심. 여행 도시 좌표를 아직 받지 않아 도쿄역으로 둔다 */
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 };

/** 날을 바꿀 때 핀이 모두 보이게 맞춘다. 가까운 핀 몇 개로 너무 확대되지 않게 15 에서 멈춘다 */
const FIT_PADDING = 36;
const MAX_ZOOM = 15;

type LatLng = { lat: number; lng: number };
type Pin = { id: string; num: number; at: LatLng; row: TimelineRow };

/** 번호가 붙은 줄(좌표 있는 place)만 핀이 된다. 타임라인 번호와 같다 */
function pinsOf(rows: TimelineRow[]): Pin[] {
  return rows.flatMap((row) =>
    row.num != null && row.item.lat != null && row.item.lng != null
      ? [{ id: row.item.id, num: row.num, at: { lat: row.item.lat, lng: row.item.lng }, row }]
      : [],
  );
}

type ScheduleMapProps = {
  rows: TimelineRow[];
  selectedId?: string | null;
  onSelect?: (row: TimelineRow) => void;
  className?: string;
};

/**
 * 하루 일정 지도. 번호 핀(예약 상태색) + 핀 사이 점선(#444, 2px, 4·6 간격).
 * 점선은 직선이다 — 실제 경로는 거리 pill 의 「경로↗」(구글맵)가 맡고, Routes API 는 부르지 않는다.
 * AdvancedMarker 라 NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID 가 필요하다.
 * 컨테이너는 isolation 으로 쌓임 맥락을 가둬, 지도 내부 패널의 z-index 가 시트 · 모달 위로 올라오지 않게 한다.
 */
export function ScheduleMap({ rows, selectedId, onSelect, className }: ScheduleMapProps) {
  const pins = pinsOf(rows);
  return (
    <div className={cn("relative isolate z-0 size-full bg-map-bg", className)}>
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        defaultCenter={pins[0]?.at ?? DEFAULT_CENTER}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        className="size-full"
      >
        {pins.map((pin) => (
          <AdvancedMarker
            key={pin.id}
            position={pin.at}
            title={pin.row.item.name}
            onClick={() => onSelect?.(pin.row)}
            zIndex={selectedId === pin.id ? 10 : 1}
          >
            <MapPin num={pin.num} status={pin.row.status} selected={selectedId === pin.id} />
          </AdvancedMarker>
        ))}
        <FitPins points={pins.map((p) => p.at)} />
        <DashedPath points={pins.map((p) => p.at)} />
      </Map>
    </div>
  );
}

type PointsProps = { points: LatLng[] };

/** 핀 목록이 바뀌면(날짜 변경 · 추가 · 삭제) 모두 보이게 맞춘다 */
function FitPins({ points }: PointsProps) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(MAX_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, FIT_PADDING);
    const zoom = map.getZoom();
    if (zoom != null && zoom > MAX_ZOOM) map.setZoom(MAX_ZOOM);
    // points 배열은 렌더마다 새로 만들어져 내용(key)으로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/** 핀을 순서대로 잇는 점선. vis.gl 에 Polyline 컴포넌트가 없어 직접 만들고 정리한다 */
function DashedPath({ points }: PointsProps) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map || points.length < 2) return;
    // 선 자체는 투명하게 두고, 짧은 선분 아이콘을 10px(4 선 + 6 빈칸) 간격으로 반복해 점선을 만든다
    const line = new google.maps.Polyline({
      path: points,
      map,
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: "M 0,-2 0,2", strokeColor: "#444", strokeOpacity: 1, strokeWeight: 2 },
          offset: "0",
          repeat: "10px",
        },
      ],
    });
    return () => line.setMap(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}
