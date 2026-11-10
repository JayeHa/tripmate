"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import type { RouteLine } from "../../lib/route";

type LatLng = { lat: number; lng: number };

/**
 * 선 모양 → Polyline 옵션. 실선은 선 그대로, 점선 · 파선은 선을 투명하게 두고 짧은 기호를 반복한다
 * (Google Maps 에 선 대시 옵션이 없다). 점선은 지름 = 굵기인 점을 굵기 × 2.5 간격으로, 파선은 굵기 × 3 길이를 굵기 × 6 간격으로
 */
function polylineOptions(line: RouteLine): google.maps.PolylineOptions {
  if (line.style === "solid") {
    return { strokeColor: line.color, strokeOpacity: 1, strokeWeight: line.width };
  }
  const icon: google.maps.Symbol =
    line.style === "dotted"
      ? {
          path: google.maps.SymbolPath.CIRCLE,
          scale: line.width / 2,
          fillColor: line.color,
          fillOpacity: 1,
          strokeOpacity: 0,
        }
      : {
          path: "M 0,-1.5 0,1.5",
          strokeColor: line.color,
          strokeOpacity: 1,
          strokeWeight: line.width,
          scale: line.width,
        };
  const gap = line.style === "dotted" ? line.width * 2.5 : line.width * 6;
  return { strokeOpacity: 0, icons: [{ icon, offset: "0", repeat: `${gap}px` }] };
}

type RoutePolylineProps = { from: LatLng; to: LatLng; line: RouteLine; zIndex: number };

/** 두 장소를 잇는 선 하나. vis.gl 에 Polyline 컴포넌트가 없어 직접 만들고 정리한다 */
export function RoutePolyline({ from, to, line, zIndex }: RoutePolylineProps) {
  const map = useMap();
  const key = `${from.lat},${from.lng}|${to.lat},${to.lng}|${line.style}|${line.width}|${line.color}|${zIndex}`;
  useEffect(() => {
    if (!map) return;
    const polyline = new google.maps.Polyline({
      path: [from, to],
      map,
      zIndex,
      clickable: false,
      ...polylineOptions(line),
    });
    return () => polyline.setMap(null);
    // 좌표 · 모양은 렌더마다 새 객체라 내용(key)으로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}
